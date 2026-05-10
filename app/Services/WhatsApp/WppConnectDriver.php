<?php

namespace App\Services\WhatsApp;

use App\Services\WhatsApp\Contracts\WhatsAppDriver;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class WppConnectDriver implements WhatsAppDriver
{
    public function __construct(
        protected string $baseUrl,
        protected string $secret,
        protected string $session,
        protected ?string $webhookSecret = null,
    ) {}

    public function name(): string
    {
        return 'wppconnect';
    }

    public function getSession(): string
    {
        return $this->session;
    }

    public function getBaseUrl(): string
    {
        return rtrim($this->baseUrl, '/');
    }

    /**
     * Generate a session bearer token via /api/{session}/{secret}/generate-token.
     * Cached for 12h since it's deterministic per session+secret.
     */
    public function token(bool $fresh = false): string
    {
        $key = "wppconnect:token:{$this->session}:" . sha1($this->secret . $this->getBaseUrl());

        if ($fresh) {
            Cache::forget($key);
        }

        return Cache::remember($key, now()->addHours(12), function () {
            $resp = Http::acceptJson()
                ->timeout(15)
                ->post($this->getBaseUrl() . "/api/{$this->session}/{$this->secret}/generate-token");

            $body = $resp->json() ?? [];
            $token = $body['token'] ?? $body['full'] ?? null;

            if (! $token || ! $resp->successful()) {
                throw new RuntimeException('wppconnect token generation failed: ' . json_encode($body));
            }

            // Strip "Bearer " prefix if present.
            return preg_replace('/^Bearer\s+/i', '', (string) $token);
        });
    }

    protected function client(): PendingRequest
    {
        return Http::baseUrl($this->getBaseUrl())
            ->withToken($this->token())
            ->acceptJson()
            ->timeout(60);
    }

    public function startSession(?string $webhookUrl = null): array
    {
        $payload = [];
        if ($webhookUrl) {
            $payload['webhook'] = $webhookUrl;
            $payload['waitQrCode'] = false;
        }
        $resp = $this->client()->post("/api/{$this->session}/start-session", $payload);
        return $resp->json() ?? [];
    }

    public function status(): array
    {
        $resp = $this->client()->get("/api/{$this->session}/check-connection-session");
        return $resp->json() ?? [];
    }

    public function qrCode(): ?string
    {
        $resp = $this->client()->get("/api/{$this->session}/qrcode-session");
        $body = $resp->json() ?? [];
        // Newer versions return { qrcode: 'data:image/png;base64,...' } or raw png — handle both.
        if (! empty($body['qrcode'])) {
            return $body['qrcode'];
        }
        if ($resp->header('content-type') && str_starts_with($resp->header('content-type'), 'image/')) {
            return 'data:' . $resp->header('content-type') . ';base64,' . base64_encode($resp->body());
        }
        return null;
    }

    public function logout(): array
    {
        $resp = $this->client()->post("/api/{$this->session}/logout-session");
        return $resp->json() ?? [];
    }

    public function sendText(string $to, string $body): array
    {
        $resp = $this->client()->post("/api/{$this->session}/send-message", [
            'phone' => $this->normalizePhone($to),
            'isGroup' => false,
            'message' => $body,
        ]);

        return $this->extractResult($resp->json() ?? [], $resp->status());
    }

    public function sendMedia(string $to, string $mediaUrl, string $type, ?string $caption = null): array
    {
        $type = strtolower($type);

        // Resolve to a local filesystem path so we can send base64 (more reliable
        // than asking wppconnect-server to fetch over HTTP).
        $localPath = $this->resolveLocalPath($mediaUrl);
        $base64 = null;
        $mime = null;
        if ($localPath && is_file($localPath)) {
            $mime = mime_content_type($localPath) ?: $this->guessMimeForType($type);
            $base64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($localPath));
        }

        $endpoint = match ($type) {
            'image' => 'send-image',
            'audio' => 'send-voice',
            'video', 'document' => 'send-file-base64',
            default => 'send-file-base64',
        };

        $dataUri = $base64 ?: $mediaUrl;

        $normalized = $this->normalizePhone($to);

        if ($type === 'audio') {
            // /send-voice endpoint: wppconnect tries downloadFileToBase64() (HTTP only,
            // matches /^https?:/) first, then falls back to fileToBase64() (local fs).
            // Prefer HTTP URL — bypasses any cross-process file permission issues and
            // gives wppconnect a clean Content-Type header for mime sniffing.
            // Phone must be ARRAY — controller iterates with `for...of` directly.
            $audioPath = $this->publicHttpUrlFor($localPath) ?: ($localPath ?: $mediaUrl);

            $payload = [
                'phone' => [$normalized],
                'isGroup' => false,
                'path' => $audioPath,
                'filename' => basename($localPath ?: parse_url($mediaUrl, PHP_URL_PATH) ?: 'voice.mp3'),
            ];
        } elseif ($endpoint === 'send-file-base64') {
            // Same array-vs-string trap on send-file-base64.
            $payload = [
                'phone' => [$normalized],
                'isGroup' => false,
                'filename' => basename($localPath ?: parse_url($mediaUrl, PHP_URL_PATH) ?: 'file'),
                'caption' => $caption,
                'base64' => $dataUri,
                'path' => $dataUri,
            ];
        } else {
            // send-image accepts a string phone.
            $payload = [
                'phone' => $normalized,
                'isGroup' => false,
                'filename' => basename($localPath ?: parse_url($mediaUrl, PHP_URL_PATH) ?: 'file'),
                'caption' => $caption,
                'base64' => $dataUri,
                'path' => $dataUri,
            ];
        }

        $resp = $this->client()->post("/api/{$this->session}/{$endpoint}", array_filter(
            $payload,
            fn ($v) => $v !== null && $v !== ''
        ));

        return $this->extractResult($resp->json() ?? [], $resp->status());
    }

    protected function publicHttpUrlFor(?string $localPath): ?string
    {
        if (! $localPath) return null;

        $publicRoot = realpath(storage_path('app/public'));
        $real = realpath($localPath);
        if (! $publicRoot || ! $real || ! str_starts_with($real, $publicRoot . DIRECTORY_SEPARATOR)) {
            return null;
        }

        $rel = ltrim(substr($real, strlen($publicRoot)), DIRECTORY_SEPARATOR);
        $appUrl = rtrim((string) config('app.url'), '/');
        if (! $appUrl) return null;

        // URL-encode each path segment (handles spaces, unicode) but keep slashes.
        $encoded = implode('/', array_map('rawurlencode', explode('/', $rel)));

        return $appUrl . '/storage/' . $encoded;
    }

    protected function resolveLocalPath(string $mediaUrl): ?string
    {
        if (is_file($mediaUrl)) {
            return $mediaUrl;
        }

        $appUrl = rtrim((string) config('app.url'), '/');
        if ($appUrl && str_starts_with($mediaUrl, $appUrl . '/storage/')) {
            $rel = substr($mediaUrl, strlen($appUrl . '/storage/'));
            $candidate = storage_path('app/public/' . $rel);
            if (is_file($candidate)) return $candidate;
        }

        $path = parse_url($mediaUrl, PHP_URL_PATH);
        if ($path && str_starts_with($path, '/storage/')) {
            $candidate = storage_path('app/public/' . substr($path, strlen('/storage/')));
            if (is_file($candidate)) return $candidate;
        }

        return null;
    }

    protected function guessMimeForType(string $type): string
    {
        return match ($type) {
            'image' => 'image/jpeg',
            'video' => 'video/mp4',
            'audio' => 'audio/mpeg',
            default => 'application/octet-stream',
        };
    }

    public function sendTemplate(string $to, string $template, string $language = 'en_US', array $components = []): array
    {
        // wppconnect has no native templates — fall back to plain text.
        return $this->sendText($to, $template);
    }

    public function uploadMedia(string $absolutePath, string $mime): string
    {
        // wppconnect does not require pre-upload — the public URL/path is sent directly.
        return $absolutePath;
    }

    public function verifyWebhook(array $query, ?string $signature, string $rawBody): bool|string
    {
        if ($this->webhookSecret) {
            return hash_equals($this->webhookSecret, (string) $signature);
        }
        return true;
    }

    public function parseWebhook(array $payload): array
    {
        $events = [];
        $event = $payload['event'] ?? null;

        if ($event === 'onmessage' || $event === 'onpollresponse' || ! $event) {
            $events[] = [
                'type' => 'message',
                'provider_message_id' => $this->normalizeId($payload['id'] ?? null),
                'status' => 'received',
                'from' => $this->stripJid($payload['from'] ?? null),
                'body' => $payload['body'] ?? ($payload['content'] ?? null),
                'timestamp' => isset($payload['timestamp']) ? (int) $payload['timestamp'] : null,
                'raw' => $payload,
            ];
        } elseif ($event === 'onack' || $event === 'status-find') {
            $events[] = [
                'type' => 'status',
                'provider_message_id' => $this->normalizeId($payload['id'] ?? ($payload['ids'][0] ?? null)),
                'status' => $this->mapAck($payload['ack'] ?? ($payload['status'] ?? null)),
                'from' => $this->stripJid($payload['to'] ?? null),
                'body' => null,
                'timestamp' => isset($payload['timestamp']) ? (int) $payload['timestamp'] : null,
                'raw' => $payload,
            ];
        }

        return ['events' => $events];
    }

    protected function normalizeId($id): ?string
    {
        if (is_array($id)) {
            return $id['_serialized'] ?? ($id['id'] ?? null);
        }
        return is_string($id) ? $id : null;
    }

    protected function mapAck($ack): ?string
    {
        return match ((int) $ack) {
            -1 => 'failed',
            0 => 'pending',
            1 => 'sent',
            2 => 'delivered',
            3 => 'read',
            4 => 'played',
            default => is_string($ack) ? $ack : null,
        };
    }

    protected function stripJid(?string $jid): ?string
    {
        if (! $jid) return null;
        return preg_replace('/@.+$/', '', $jid);
    }

    protected function extractResult(array $body, int $status): array
    {
        $resp = $body['response'] ?? $body;
        $id = $resp['id'] ?? ($resp[0]['id'] ?? null);
        if (is_array($id)) {
            $id = $id['_serialized'] ?? ($id['id'] ?? null);
        }
        if (! $id && $status >= 400) {
            throw new RuntimeException('wppconnect send failed: ' . json_encode($body));
        }
        return ['provider_message_id' => $id, 'raw' => $body];
    }

    protected function normalizePhone(string $phone): string
    {
        return ltrim(preg_replace('/[^\d+]/', '', $phone), '+');
    }
}
