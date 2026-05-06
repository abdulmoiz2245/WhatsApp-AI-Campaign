<?php

namespace App\Services\WhatsApp;

use App\Services\WhatsApp\Contracts\WhatsAppDriver;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class TwilioWhatsAppDriver implements WhatsAppDriver
{
    public function __construct(
        protected string $sid,
        protected string $token,
        protected string $from,
    ) {}

    public function name(): string
    {
        return 'twilio';
    }

    protected function url(): string
    {
        return "https://api.twilio.com/2010-04-01/Accounts/{$this->sid}/Messages.json";
    }

    public function sendText(string $to, string $body): array
    {
        $resp = Http::withBasicAuth($this->sid, $this->token)
            ->asForm()
            ->post($this->url(), [
                'From' => $this->from,
                'To' => $this->ensureWhatsAppPrefix($to),
                'Body' => $body,
            ]);

        return $this->extract($resp->json() ?? [], $resp->status());
    }

    public function sendMedia(string $to, string $mediaUrl, string $type, ?string $caption = null): array
    {
        $resp = Http::withBasicAuth($this->sid, $this->token)
            ->asForm()
            ->post($this->url(), [
                'From' => $this->from,
                'To' => $this->ensureWhatsAppPrefix($to),
                'Body' => $caption ?: '',
                'MediaUrl' => $mediaUrl,
            ]);

        return $this->extract($resp->json() ?? [], $resp->status());
    }

    public function sendTemplate(string $to, string $template, string $language = 'en_US', array $components = []): array
    {
        // Twilio uses pre-approved Content Templates referenced by ContentSid;
        // here, $template is treated as the ContentSid and components are template variables.
        $resp = Http::withBasicAuth($this->sid, $this->token)
            ->asForm()
            ->post($this->url(), array_filter([
                'From' => $this->from,
                'To' => $this->ensureWhatsAppPrefix($to),
                'ContentSid' => $template,
                'ContentVariables' => $components ? json_encode($components) : null,
            ]));

        return $this->extract($resp->json() ?? [], $resp->status());
    }

    public function uploadMedia(string $absolutePath, string $mime): string
    {
        // Twilio requires public URLs. Move the file into the public disk and return its URL.
        $disk = Storage::disk('public');
        $rel = 'wa-media/' . uniqid() . '_' . basename($absolutePath);
        $disk->put($rel, file_get_contents($absolutePath));
        return $disk->url($rel);
    }

    public function verifyWebhook(array $query, ?string $signature, string $rawBody): bool|string
    {
        // Twilio signs requests with X-Twilio-Signature.
        // Validation requires the full URL + POST params, handled in controller.
        return $signature !== null;
    }

    public function parseWebhook(array $payload): array
    {
        $events = [];

        if (! empty($payload['MessageSid']) || ! empty($payload['SmsSid'])) {
            $sid = $payload['MessageSid'] ?? $payload['SmsSid'];
            $status = $payload['MessageStatus'] ?? $payload['SmsStatus'] ?? null;
            $from = isset($payload['From']) ? str_replace('whatsapp:', '', $payload['From']) : null;
            $body = $payload['Body'] ?? null;

            if ($status) {
                $events[] = [
                    'type' => 'status',
                    'provider_message_id' => $sid,
                    'status' => strtolower($status),
                    'from' => $from,
                    'body' => null,
                    'timestamp' => time(),
                    'raw' => $payload,
                ];
            }

            if ($body !== null) {
                $events[] = [
                    'type' => 'message',
                    'provider_message_id' => $sid,
                    'status' => 'received',
                    'from' => $from,
                    'body' => $body,
                    'timestamp' => time(),
                    'raw' => $payload,
                ];
            }
        }

        return ['events' => $events];
    }

    protected function extract(array $body, int $status): array
    {
        $sid = $body['sid'] ?? null;
        if (! $sid && $status >= 400) {
            throw new RuntimeException('Twilio send failed: ' . json_encode($body));
        }
        return ['provider_message_id' => $sid, 'raw' => $body];
    }

    protected function ensureWhatsAppPrefix(string $to): string
    {
        return str_starts_with($to, 'whatsapp:') ? $to : 'whatsapp:' . (str_starts_with($to, '+') ? $to : '+' . ltrim($to, '+'));
    }
}
