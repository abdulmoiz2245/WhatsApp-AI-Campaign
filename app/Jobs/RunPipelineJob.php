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
        $pipe->update(['status' => 'running', 'started_at' => now(), 'progress' => 0]);

        try {
            // Stage 1: ensure script exists
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

            // Stage 2: voiceover
            $pipe->markStage('voiceover', 'running');
            $audio = $media->ttsFor($pipe->user)->synthesize($script);
            $pipe->update([
                'voiceover_path' => $audio['path'],
                'voiceover_duration_ms' => $audio['duration_ms'],
            ]);
            $pipe->markStage('voiceover', 'completed', ['path' => basename($audio['path'])]);

            // Stage 3: thumbnail (also serves as a slideshow frame for ffmpeg driver)
            $pipe->markStage('thumbnail', 'running');
            $thumbPrompt = $pipe->researchTopic?->metadata['thumbnail_prompt']
                ?? "Cinematic thumbnail for: {$pipe->title}. Vibrant, high-contrast, clean composition.";
            $thumbPath = $ai->imageFor($pipe->user)->generate($thumbPrompt, ['size' => '1024x1024']);
            $pipe->update(['thumbnail_path' => $thumbPath]);
            $pipe->markStage('thumbnail', 'completed', ['path' => basename($thumbPath)]);

            // Stage 4: video composition
            $pipe->markStage('video', 'running');
            $videoDriver = $media->videoFor($pipe->user);
            $videoPath = $videoDriver->compose([
                'audio_path' => $audio['path'],
                'images' => [$thumbPath],
                'script' => $script,
                'title' => $pipe->title,
                'resolution' => '1080x1920',
            ]);
            $pipe->update(['video_path' => $videoPath]);
            $pipe->markStage('video', 'completed', ['path' => basename($videoPath)]);

            // Stage 5: upload to WhatsApp (Meta returns media id; Twilio returns hosted URL)
            $pipe->markStage('upload', 'running');
            $waDriver = $wa->for($pipe->user);
            $mediaId = $waDriver->uploadMedia($videoPath, 'video/mp4');
            $pipe->update(['whatsapp_media_id' => $mediaId]);
            $pipe->markStage('upload', 'completed', ['media_id' => $mediaId]);

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
}
