<?php

namespace App\Jobs;

use App\Models\ResearchTopic;
use App\Services\AI\AIManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class RunResearchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;
    public int $tries = 2;

    public function __construct(public int $topicId) {}

    public function handle(AIManager $ai): void
    {
        $topic = ResearchTopic::with('user')->findOrFail($this->topicId);
        $topic->update(['status' => 'researching']);

        try {
            $text = $ai->textFor($topic->user);

            $system = <<<SYS
            You are an expert AI content researcher creating concise, fact-based research briefs and scripts for short-form WhatsApp campaign videos.
            Always respond as JSON with keys: summary, outline (array of bullets), script (string, ~120-180 words for ~60s narration), thumbnail_prompt (string), sources (array of strings).

            THUMBNAIL_PROMPT RULES (high-converting news thumbnails):
            Formula: [Subject/Event] + [Atmosphere/Environment] + [Lighting/Style] + [Aspect Ratio 16:9].
            - Subject/Event must be GENERIC and SAFE — no real named people, no political party logos, no copyrighted characters, no graphic violence. Replace with anonymous archetypes (e.g. "a generic news anchor", "an unidentified diplomat silhouette", "a stylized modern parliament building").
            - Atmosphere/Environment: cinematic news-set vibe, world maps, glowing screens, city skylines, rule-of-thirds composition leaving negative space on one side for a text overlay.
            - Lighting/Style: dramatic high-contrast lighting; bold red/white/black palette for breaking news; cool blue tones for tech/finance; warm tones for human-interest. Ultra-realistic 4K photography or cinematic editorial illustration style.
            - End the prompt with: "16:9 aspect ratio, leave left-third empty for headline overlay."
            - One paragraph, 50-90 words, no markdown, no quotes.
            SYS;

            $user = "Topic: {$topic->topic}\nContent type: {$topic->content_type}\nTone: {$topic->tone}\nLanguage: {$topic->language}\n\nReturn ONLY JSON.";

            $raw = $text->complete([
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $user],
            ], ['response_format' => ['type' => 'json_object'], 'temperature' => 0.7]);

            $data = json_decode($raw, true) ?: $this->salvageJson($raw);

            $topic->fill([
                'research_summary' => $data['summary'] ?? null,
                'outline' => $data['outline'] ?? [],
                'script' => $data['script'] ?? null,
                'sources' => $data['sources'] ?? [],
                'metadata' => array_merge($topic->metadata ?? [], [
                    'thumbnail_prompt' => $data['thumbnail_prompt'] ?? null,
                ]),
                'status' => 'completed',
                'completed_at' => now(),
            ])->save();
        } catch (Throwable $e) {
            $topic->update([
                'status' => 'failed',
                'metadata' => array_merge($topic->metadata ?? [], ['error' => $e->getMessage()]),
            ]);
            throw $e;
        }
    }

    protected function salvageJson(string $raw): array
    {
        if (preg_match('/\{.*\}/s', $raw, $m)) {
            return json_decode($m[0], true) ?: [];
        }
        return [];
    }
}
