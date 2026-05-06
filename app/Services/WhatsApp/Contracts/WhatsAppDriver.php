<?php

namespace App\Services\WhatsApp\Contracts;

interface WhatsAppDriver
{
    /**
     * Send a plain text WhatsApp message.
     *
     * @return array{provider_message_id: ?string, raw: array}
     */
    public function sendText(string $to, string $body): array;

    /**
     * Send a media message (image/video/document/audio).
     */
    public function sendMedia(string $to, string $mediaUrl, string $type, ?string $caption = null): array;

    /**
     * Send a pre-approved template (Meta) or templated body (Twilio).
     *
     * @param  array<string,mixed>  $components
     */
    public function sendTemplate(string $to, string $template, string $language = 'en_US', array $components = []): array;

    /**
     * Upload a local media file and return a provider media id (Meta) or
     * a hostable URL (Twilio uses URLs directly — implementations may upload to storage first).
     */
    public function uploadMedia(string $absolutePath, string $mime): string;

    /**
     * Verify webhook signature / challenge.
     */
    public function verifyWebhook(array $query, ?string $signature, string $rawBody): bool|string;

    /**
     * Normalize an incoming webhook payload into our internal shape:
     * [
     *   'events' => [
     *     ['type' => 'status'|'message'|'reply', 'provider_message_id' => string|null,
     *      'status' => string|null, 'from' => string|null, 'body' => string|null,
     *      'timestamp' => int|null, 'raw' => array],
     *     ...
     *   ]
     * ]
     */
    public function parseWebhook(array $payload): array;

    public function name(): string;
}
