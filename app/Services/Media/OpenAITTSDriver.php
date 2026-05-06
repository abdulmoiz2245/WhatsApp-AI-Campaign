<?php

namespace App\Services\Media;

use App\Services\Media\Contracts\TextToSpeech;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class OpenAITTSDriver implements TextToSpeech
{
    public function __construct(protected string $apiKey, protected string $model = 'tts-1-hd') {}

    public function name(): string { return 'openai'; }

    public function synthesize(string $text, array $options = []): array
    {
        if (! $this->apiKey) {
            throw new RuntimeException('OPENAI_API_KEY is not set.');
        }

        $resp = Http::withToken($this->apiKey)
            ->timeout(180)
            ->post('https://api.openai.com/v1/audio/speech', [
                'model' => $options['model'] ?? $this->model,
                'voice' => $options['voice'] ?? 'alloy',
                'input' => $text,
                'format' => 'mp3',
            ]);

        if (! $resp->successful()) {
            throw new RuntimeException('OpenAI TTS error: ' . $resp->body());
        }

        $rel = 'voiceovers/' . Str::uuid() . '.mp3';
        Storage::disk('public')->put($rel, $resp->body());

        return [
            'path' => Storage::disk('public')->path($rel),
            'duration_ms' => null,
            'mime' => 'audio/mpeg',
        ];
    }
}
