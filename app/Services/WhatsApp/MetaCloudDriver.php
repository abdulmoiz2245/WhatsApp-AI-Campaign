<?php

namespace App\Services\WhatsApp;

use App\Services\WhatsApp\Contracts\WhatsAppDriver;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MetaCloudDriver implements WhatsAppDriver
{
    public function __construct(
        protected string $phoneNumberId,
        protected string $accessToken,
        protected string $verifyToken,
        protected string $apiVersion = 'v21.0',
    ) {}

    public function name(): string
    {
        return 'meta';
    }

    protected function client(): PendingRequest
    {
        return Http::baseUrl("https://graph.facebook.com/{$this->apiVersion}/")
            ->withToken($this->accessToken)
            ->acceptJson()
            ->timeout(30);
    }

    public function sendText(string $to, string $body): array
    {
        $resp = $this->client()->post("{$this->phoneNumberId}/messages", [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $this->normalizePhone($to),
            'type' => 'text',
            'text' => ['body' => $body, 'preview_url' => true],
        ]);

        return $this->extractResult($resp->json() ?? [], $resp->status());
    }

    public function sendMedia(string $to, string $mediaUrl, string $type, ?string $caption = null): array
    {
        $type = strtolower($type);
        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $this->normalizePhone($to),
            'type' => $type,
            $type => array_filter([
                'link' => $mediaUrl,
                'caption' => in_array($type, ['image', 'video', 'document'], true) ? $caption : null,
            ]),
        ];

        $resp = $this->client()->post("{$this->phoneNumberId}/messages", $payload);

        return $this->extractResult($resp->json() ?? [], $resp->status());
    }

    public function sendTemplate(string $to, string $template, string $language = 'en_US', array $components = []): array
    {
        $resp = $this->client()->post("{$this->phoneNumberId}/messages", [
            'messaging_product' => 'whatsapp',
            'to' => $this->normalizePhone($to),
            'type' => 'template',
            'template' => array_filter([
                'name' => $template,
                'language' => ['code' => $language],
                'components' => $components ?: null,
            ]),
        ]);

        return $this->extractResult($resp->json() ?? [], $resp->status());
    }

    public function uploadMedia(string $absolutePath, string $mime): string
    {
        if (! is_file($absolutePath)) {
            throw new RuntimeException("Media file not found: {$absolutePath}");
        }

        $resp = $this->client()
            ->asMultipart()
            ->attach('file', file_get_contents($absolutePath), basename($absolutePath), ['Content-Type' => $mime])
            ->post("{$this->phoneNumberId}/media", [
                ['name' => 'messaging_product', 'contents' => 'whatsapp'],
                ['name' => 'type', 'contents' => $mime],
            ]);

        $body = $resp->json() ?? [];
        if (! $resp->successful() || empty($body['id'])) {
            throw new RuntimeException('Meta media upload failed: ' . json_encode($body));
        }

        return $body['id'];
    }

    public function verifyWebhook(array $query, ?string $signature, string $rawBody): bool|string
    {
        // GET subscription verification
        if (($query['hub_mode'] ?? null) === 'subscribe'
            && ($query['hub_verify_token'] ?? null) === $this->verifyToken) {
            return $query['hub_challenge'] ?? '';
        }
        return false;
    }

    public function parseWebhook(array $payload): array
    {
        $events = [];
        foreach ($payload['entry'] ?? [] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                $value = $change['value'] ?? [];

                foreach ($value['statuses'] ?? [] as $s) {
                    $events[] = [
                        'type' => 'status',
                        'provider_message_id' => $s['id'] ?? null,
                        'status' => $s['status'] ?? null,
                        'from' => $s['recipient_id'] ?? null,
                        'body' => null,
                        'timestamp' => isset($s['timestamp']) ? (int) $s['timestamp'] : null,
                        'raw' => $s,
                    ];
                }

                foreach ($value['messages'] ?? [] as $m) {
                    $body = $m['text']['body'] ?? null;
                    $events[] = [
                        'type' => 'message',
                        'provider_message_id' => $m['id'] ?? null,
                        'status' => 'received',
                        'from' => $m['from'] ?? null,
                        'body' => $body,
                        'timestamp' => isset($m['timestamp']) ? (int) $m['timestamp'] : null,
                        'raw' => $m,
                    ];
                }
            }
        }

        return ['events' => $events];
    }

    protected function extractResult(array $body, int $status): array
    {
        $id = $body['messages'][0]['id'] ?? null;
        if (! $id && $status >= 400) {
            throw new RuntimeException('Meta send failed: ' . json_encode($body));
        }
        return ['provider_message_id' => $id, 'raw' => $body];
    }

    protected function normalizePhone(string $phone): string
    {
        return ltrim(preg_replace('/[^\d+]/', '', $phone), '+');
    }
}
