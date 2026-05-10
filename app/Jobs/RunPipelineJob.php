<?php

namespace App\Jobs;

use App\Models\PipelineJob;
use App\Services\AI\AIManager;
use App\Services\Media\MediaManager;
use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class RunPipelineJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 1800;
    public int $tries = 1;

    public function __construct(public int $pipelineJobId) {}

    public function handle(AIManager $ai, MediaManager $media, WhatsAppManager $wa): void
    {
        $pipe = PipelineJob::with(['user', 'researchTopic'])->findOrFail($this->pipelineJobId);
        $pipe->update(['status' => 'running', 'started_at' => now()]);

        try {
            // Stage 1: script (always required)
            if (! $pipe->stageCompleted('script')) {
                $pipe->markStage('script', 'running');
                $script = $pipe->script ?: ($pipe->researchTopic?->script ?? '');
                if (! $script) {
                    $text = $ai->textFor($pipe->user);
                    $script = $text->complete([
                        ['role' => 'system', 'content' => 'Write a concise 120-180 word script for a vertical short-form video on the given topic. Return only the script.'],
                        ['role' => 'user', 'content' => $pipe->title],
                    ]);
                }
                $pipe->update(['script' => $script]);
                $pipe->markStage('script', 'completed', ['chars' => strlen($script)]);
            }

            // Stage 2: voiceover (optional)
            $audio = ['path' => $pipe->voiceover_path, 'duration_ms' => $pipe->voiceover_duration_ms];
            if ($pipe->stageEnabled('voiceover')) {
                if (! $pipe->stageCompleted('voiceover')) {
                    $pipe->markStage('voiceover', 'running');
                    $audio = $media->ttsFor($pipe->user)->synthesize($pipe->script);
                    $pipe->update([
                        'voiceover_path' => $audio['path'],
                        'voiceover_duration_ms' => $audio['duration_ms'],
                    ]);
                    $pipe->markStage('voiceover', 'completed', ['path' => basename($audio['path'])]);
                }
            } else {
                $pipe->markStage('voiceover', 'skipped');
            }

            // Stage 3: thumbnail (optional, with safe-prompt auto-retry)
            $thumbPath = $pipe->thumbnail_path;
            if ($pipe->stageEnabled('thumbnail')) {
                if (! $pipe->stageCompleted('thumbnail')) {
                    $pipe->markStage('thumbnail', 'running');
                    $basePrompt = $pipe->researchTopic?->metadata['thumbnail_prompt']
                        ?: $this->buildNewsThumbnailFallback($pipe);
                    $thumbPath = $this->generateThumbnailWithRetry($pipe, $ai, $basePrompt);
                    if ($thumbPath) {
                        $pipe->update(['thumbnail_path' => $thumbPath]);
                        $pipe->markStage('thumbnail', 'completed', ['path' => basename($thumbPath)]);
                    } else {
                        $pipe->markStage('thumbnail', 'skipped', ['reason' => 'content_policy_violation_after_retries']);
                    }
                }
            } else {
                $pipe->markStage('thumbnail', 'skipped');
            }

            // Stage 4: video composition (optional, requires audio + thumbnail)
            $videoPath = $pipe->video_path;
            if ($pipe->stageEnabled('video')) {
                if (! $pipe->stageCompleted('video')) {
                    if (! $audio['path'] || ! $thumbPath) {
                        $pipe->markStage('video', 'skipped', ['reason' => 'missing_inputs (voiceover or thumbnail unavailable)']);
                        $videoPath = null;
                    } else {
                        $pipe->markStage('video', 'running');
                        $videoDriver = $media->videoFor($pipe->user);
                        $videoPath = $videoDriver->compose([
                            'audio_path' => $audio['path'],
                            'images' => [$thumbPath],
                            'script' => $pipe->script,
                            'title' => $pipe->title,
                            'resolution' => '1080x1920',
                        ]);
                        $pipe->update(['video_path' => $videoPath]);
                        $pipe->markStage('video', 'completed', ['path' => basename($videoPath)]);
                    }
                }
            } else {
                $pipe->markStage('video', 'skipped');
            }

            // Stage 5: WhatsApp upload (optional)
            if ($pipe->stageEnabled('upload')) {
                if (! $pipe->stageCompleted('upload')) {
                    $uploadPath = $videoPath ?: $thumbPath;
                    if (! $uploadPath) {
                        $pipe->markStage('upload', 'skipped', ['reason' => 'missing_inputs (no video or thumbnail to upload)']);
                    } else {
                        $mime = $videoPath ? 'video/mp4' : 'image/png';
                        $pipe->markStage('upload', 'running');
                        $waDriver = $wa->for($pipe->user);
                        $mediaId = $waDriver->uploadMedia($uploadPath, $mime);
                        $pipe->update(['whatsapp_media_id' => $mediaId]);
                        $pipe->markStage('upload', 'completed', ['media_id' => $mediaId]);
                    }
                }
            } else {
                $pipe->markStage('upload', 'skipped');
            }

            $pipe->update([
                'status' => 'completed',
                'progress' => 100,
                'current_stage' => 'done',
                'completed_at' => now(),
            ]);
        } catch (Throwable $e) {
            $pipe->update([
                'status' => 'failed',
                'error' => ['message' => $e->getMessage(), 'stage' => $pipe->current_stage],
            ]);
            throw $e;
        }
    }

    protected function buildNewsThumbnailFallback(PipelineJob $pipe): string
    {
        $topic = $pipe->researchTopic;
        $article = $topic?->newsArticle;
        $category = strtolower((string) ($article->category ?? 'top'));
        $title = $pipe->title;

        $palette = match (true) {
            str_contains($category, 'tech') || str_contains($category, 'finance') || str_contains($category, 'business')
                => 'cool blue and cyan tones, dramatic rim lighting, ultra-realistic 4k editorial photography',
            str_contains($category, 'polit') || str_contains($category, 'world') || str_contains($category, 'breaking')
                => 'bold red, white and black palette, high-contrast cinematic lighting, dramatic 4k news photography',
            str_contains($category, 'sport')
                => 'vibrant stadium lighting, motion blur energy, saturated contrast, cinematic 4k sports photography',
            default
                => 'cinematic high-contrast lighting, bold red/white/black palette, ultra-realistic 4k editorial photography',
        };

        $env = match (true) {
            str_contains($category, 'tech') || str_contains($category, 'finance') || str_contains($category, 'business')
                => 'modern trading-floor environment with glowing market charts and a blurred city skyline',
            str_contains($category, 'polit') || str_contains($category, 'world')
                => 'stylized modern parliament-style building with subtle world-map background, no party logos, no real named people',
            str_contains($category, 'sport')
                => 'generic stadium environment with floodlights and crowd silhouettes, no team logos',
            default
                => 'high-tech news anchor desk with glowing blue screens and a subtle world map in the background',
        };

        return "Editorial news thumbnail concept inspired by: \"{$title}\". "
            . "Subject: a generic anonymous archetype (no real named people, no party logos, no copyrighted characters). "
            . "Environment: {$env}. "
            . "Style: {$palette}. "
            . "Rule-of-thirds composition with the main subject on the right third, 16:9 aspect ratio, leave left-third empty for headline overlay.";
    }

    protected function generateThumbnailWithRetry(PipelineJob $pipe, AIManager $ai, string $basePrompt, int $maxRewrites = 2): ?string
    {
        $imageDriver = $ai->imageFor($pipe->user);
        $textDriver = null;
        $prompt = $basePrompt;
        $attempts = [];

        for ($attempt = 0; $attempt <= $maxRewrites; $attempt++) {
            try {
                return $imageDriver->generate($prompt, ['size' => '1792x1024']);
            } catch (Throwable $e) {
                $msg = $e->getMessage();
                $attempts[] = ['attempt' => $attempt + 1, 'prompt' => $prompt, 'error' => $msg];

                $isPolicy = str_contains($msg, 'content_policy_violation')
                    || str_contains($msg, 'safety system')
                    || str_contains($msg, 'not allowed');

                if (! $isPolicy || $attempt === $maxRewrites) {
                    $pipe->update([
                        'stages' => array_merge($pipe->stages ?? [], [
                            'thumbnail' => array_merge($pipe->stages['thumbnail'] ?? [], [
                                'attempts' => $attempts,
                                'last_error' => $msg,
                            ]),
                        ]),
                    ]);
                    if (! $isPolicy) {
                        throw $e;
                    }
                    return null;
                }

                $textDriver ??= $ai->textFor($pipe->user);
                try {
                    $prompt = $textDriver->complete([
                        ['role' => 'system', 'content' => 'You rewrite image-generation prompts that were rejected by an image model safety filter. Return ONLY the rewritten prompt — no preamble. Identify likely policy issues (named real people, violence, sensitive politics, copyrighted characters, explicit content) and replace them with neutral, generic, safe descriptors while preserving the visual concept (composition, mood, colors, setting).'],
                        ['role' => 'user', 'content' => "Original prompt:\n{$prompt}\n\nRejection reason from image API:\n{$msg}\n\nRewrite a safe version."],
                    ]);
                    $prompt = trim($prompt);
                } catch (Throwable) {
                    $prompt = "Abstract cinematic illustration, vibrant colors, high-contrast clean composition. Topic: {$pipe->title}";
                }
            }
        }

        return null;
    }
}
