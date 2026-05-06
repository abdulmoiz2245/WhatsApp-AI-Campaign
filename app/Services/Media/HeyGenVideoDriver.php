<?php

namespace App\Services\Media;

use App\Services\Media\Contracts\VideoComposer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class HeyGenVideoDriver implements VideoComposer
{
    public function __construct(
        protected string $apiKey,
        protected string $avatarId,
        protected string $voiceId,
    ) {}

    public function name(): string { return 'heygen'; }

    /**
     * Submits a script to HeyGen for avatar-based video generation,
     * polls for completion, downloads and saves the result locally.
     */
    public function compose(array $inputs): string
    {
        if (! $this->apiKey) {
            throw new RuntimeException('HEYGEN_API_KEY is not set.');
        }

        $script = trim((string) ($inputs['script'] ?? ''));
        if ($script === '') {
            throw new RuntimeException('HeyGen driver requires a non-empty script.');
        }

        $resp = Http::withHeaders(['X-Api-Key' => $this->apiKey])
            ->acceptJson()
            ->timeout(60)
            ->post('https://api.heygen.com/v2/video/generate', [
                'video_inputs' => [[
                    'character' => [
                        'type' => 'avatar',
                        'avatar_id' => $this->avatarId,
                        'avatar_style' => 'normal',
                    ],
                    'voice' => [
                        'type' => 'text',
                        'input_text' => $script,
                        'voice_id' => $this->voiceId,
                    ],
                ]],
                'dimension' => ['width' => 1080, 'height' => 1920],
                'caption' => false,
            ]);

        $body = $resp->json() ?? [];
        if (! $resp->successful() || empty($body['data']['video_id'])) {
            throw new RuntimeException('HeyGen submit failed: ' . json_encode($body));
        }

        $videoId = $body['data']['video_id'];
        $deadline = time() + 1500;
        $url = null;
        while (time() < $deadline) {
            sleep(8);
            $status = Http::withHeaders(['X-Api-Key' => $this->apiKey])
                ->acceptJson()
                ->get('https://api.heygen.com/v1/video_status.get', ['video_id' => $videoId])
                ->json() ?? [];
            $state = $status['data']['status'] ?? null;
            if ($state === 'completed') {
                $url = $status['data']['video_url'] ?? null;
                break;
            }
            if (in_array($state, ['failed', 'error'], true)) {
                throw new RuntimeException('HeyGen render failed: ' . json_encode($status));
            }
        }

        if (! $url) {
            throw new RuntimeException("HeyGen render timed out (video_id={$videoId})");
        }

        $bin = Http::timeout(300)->get($url)->body();
        $rel = 'videos/' . Str::uuid() . '.mp4';
        Storage::disk('public')->put($rel, $bin);

        return Storage::disk('public')->path($rel);
    }
}
