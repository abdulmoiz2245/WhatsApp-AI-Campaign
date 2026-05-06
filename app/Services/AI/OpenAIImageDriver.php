<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\ImageGenerator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class OpenAIImageDriver implements ImageGenerator
{
    public function __construct(protected string $apiKey, protected string $model) {}

    public function name(): string { return 'openai'; }

    public function generate(string $prompt, array $options = []): string
    {
        if (! $this->apiKey) {
            throw new RuntimeException('OPENAI_API_KEY is not set.');
        }

        $resp = Http::withToken($this->apiKey)
            ->acceptJson()
            ->timeout((int) ($options['timeout'] ?? 120))
            ->post('https://api.openai.com/v1/images/generations', [
                'model' => $options['model'] ?? $this->model,
                'prompt' => $prompt,
                'n' => 1,
                'size' => $options['size'] ?? '1024x1024',
                'response_format' => 'b64_json',
            ]);

        $body = $resp->json() ?? [];
        if (! $resp->successful() || empty($body['data'][0]['b64_json'])) {
            throw new RuntimeException('OpenAI image error: ' . json_encode($body));
        }

        $bin = base64_decode($body['data'][0]['b64_json']);
        $rel = 'thumbnails/' . Str::uuid() . '.png';
        Storage::disk('public')->put($rel, $bin);

        return Storage::disk('public')->path($rel);
    }
}
