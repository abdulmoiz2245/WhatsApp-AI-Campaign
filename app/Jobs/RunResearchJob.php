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

            $system = "You are an expert AI content researcher creating concise, fact-based research briefs and scripts for short-form WhatsApp campaign videos. Always respond as JSON with keys: summary, outline (array of bullets), script (string, ~120-180 words for ~60s narration), thumbnail_prompt (string), sources (array of strings).";

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
