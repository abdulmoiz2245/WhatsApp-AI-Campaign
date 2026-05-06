<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\TextGenerator;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AnthropicTextDriver implements TextGenerator
{
    public function __construct(protected string $apiKey, protected string $model) {}

    public function name(): string { return 'anthropic'; }

    public function complete(array $messages, array $options = []): string
    {
        if (! $this->apiKey) {
            throw new RuntimeException('ANTHROPIC_API_KEY is not set.');
        }

        $system = null;
        $userMessages = [];
        foreach ($messages as $m) {
            if (($m['role'] ?? '') === 'system') {
                $system = ($system ? $system . "\n\n" : '') . $m['content'];
            } else {
                $userMessages[] = ['role' => $m['role'], 'content' => $m['content']];
            }
        }

        $resp = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
            ])
            ->acceptJson()
            ->timeout((int) ($options['timeout'] ?? 120))
            ->post('https://api.anthropic.com/v1/messages', array_filter([
                'model' => $options['model'] ?? $this->model,
                'system' => $system,
                'messages' => $userMessages,
                'max_tokens' => $options['max_tokens'] ?? 4096,
                'temperature' => $options['temperature'] ?? 0.7,
            ]));

        $body = $resp->json() ?? [];
        if (! $resp->successful()) {
            throw new RuntimeException('Anthropic text error: ' . json_encode($body));
        }

        $out = '';
        foreach ($body['content'] ?? [] as $block) {
            if (($block['type'] ?? null) === 'text') {
                $out .= $block['text'];
            }
        }
        return $out;
    }
}
