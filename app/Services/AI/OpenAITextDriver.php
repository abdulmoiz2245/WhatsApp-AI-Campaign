<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\TextGenerator;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAITextDriver implements TextGenerator
{
    public function __construct(protected string $apiKey, protected string $model) {}

    public function name(): string { return 'openai'; }

    public function complete(array $messages, array $options = []): string
    {
        if (! $this->apiKey) {
            throw new RuntimeException('OPENAI_API_KEY is not set.');
        }

        $resp = Http::withToken($this->apiKey)
            ->acceptJson()
            ->timeout((int) ($options['timeout'] ?? 90))
            ->post('https://api.openai.com/v1/chat/completions', array_filter([
                'model' => $options['model'] ?? $this->model,
                'messages' => $messages,
                'temperature' => $options['temperature'] ?? 0.7,
                'max_tokens' => $options['max_tokens'] ?? null,
                'response_format' => $options['response_format'] ?? null,
            ]));

        $body = $resp->json() ?? [];
        if (! $resp->successful()) {
            throw new RuntimeException('OpenAI text error: ' . json_encode($body));
        }

        return $body['choices'][0]['message']['content'] ?? '';
    }
}
