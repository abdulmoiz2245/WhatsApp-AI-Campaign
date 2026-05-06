<?php

namespace App\Services\Media;

use App\Services\Media\Contracts\TextToSpeech;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ElevenLabsTTSDriver implements TextToSpeech
{
    public function __construct(
        protected string $apiKey,
        protected string $voiceId,
        protected string $model = 'eleven_multilingual_v2',
    ) {}

    public function name(): string { return 'elevenlabs'; }

    public function synthesize(string $text, array $options = []): array
    {
        if (! $this->apiKey) {
            throw new RuntimeException('ELEVENLABS_API_KEY is not set.');
        }

        $voiceId = $options['voice_id'] ?? $this->voiceId;

        $resp = Http::withHeaders([
                'xi-api-key' => $this->apiKey,
                'Accept' => 'audio/mpeg',
            ])
            ->timeout((int) ($options['timeout'] ?? 180))
            ->post("https://api.elevenlabs.io/v1/text-to-speech/{$voiceId}", [
                'text' => $text,
                'model_id' => $options['model'] ?? $this->model,
                'voice_settings' => [
                    'stability' => $options['stability'] ?? 0.5,
                    'similarity_boost' => $options['similarity_boost'] ?? 0.75,
                ],
            ]);

        if (! $resp->successful()) {
            throw new RuntimeException('ElevenLabs error: ' . $resp->body());
        }

        $rel = 'voiceovers/' . Str::uuid() . '.mp3';
        Storage::disk('public')->put($rel, $resp->body());
        $abs = Storage::disk('public')->path($rel);

        return [
            'path' => $abs,
            'duration_ms' => null,
            'mime' => 'audio/mpeg',
        ];
    }
}
