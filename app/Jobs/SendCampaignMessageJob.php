<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\Contact;
use App\Models\Message;
use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class SendCampaignMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(public int $campaignId, public int $contactId) {}

    public function handle(WhatsAppManager $wa): void
    {
        $campaign = Campaign::with('user', 'template', 'pipelineJob', 'researchTopic')->findOrFail($this->campaignId);
        $contact = Contact::findOrFail($this->contactId);

        if ($contact->status !== 'active') {
            return;
        }

        $body = $this->renderBody($campaign->message_body ?? '', $contact);
        $driver = $wa->for($campaign->user);
        $provider = $campaign->user->effectiveSettings()->whatsapp_driver ?: config('services.whatsapp.driver');

        try {
            // Template path stays as-is.
            if ($campaign->template) {
                $message = $this->logOutbound($campaign, $contact, $provider, 'text', $body, null);
                $result = $driver->sendTemplate(
                    to: $contact->phone,
                    template: $campaign->template->provider_template_name ?: $campaign->template->name,
                    language: $campaign->template->language ?: 'en_US',
                );
                $this->markSent($message, $result, $campaign, $contact);
                return;
            }

            // Multi-part path: research-driven campaign with selected parts.
            $sendParts = $campaign->send_parts ?? [];
            $pipeline = $campaign->pipelineJob;

            if (! empty($sendParts) && $pipeline) {
                $parts = $this->resolveParts($sendParts, $pipeline, $body);
                foreach ($parts as $part) {
                    $msg = $this->logOutbound($campaign, $contact, $provider, $part['type'], $part['body'] ?? '', $part['media_url'] ?? null);
                    if ($part['type'] === 'text') {
                        $result = $driver->sendText($contact->phone, $part['body']);
                    } else {
                        $result = $driver->sendMedia(
                            to: $contact->phone,
                            mediaUrl: $part['media_url'],
                            type: $part['wa_type'],
                            caption: null,
                        );
                    }
                    $this->markSent($msg, $result, $campaign, $contact);
                }
                return;
            }

            // Legacy path: single message_body or media_url.
            $message = $this->logOutbound(
                $campaign, $contact, $provider,
                $campaign->media_url ? ($campaign->media_type ?: 'image') : 'text',
                $body,
                $campaign->media_url,
            );

            if ($campaign->media_url) {
                $result = $driver->sendMedia(
                    to: $contact->phone,
                    mediaUrl: $campaign->media_url,
                    type: $campaign->media_type ?: 'image',
                    caption: $body ?: null,
                );
            } else {
                $result = $driver->sendText($contact->phone, $body);
            }
            $this->markSent($message, $result, $campaign, $contact);
        } catch (Throwable $e) {
            $campaign->increment('failed_count');
            throw $e;
        }
    }

    protected function resolveParts(array $sendParts, $pipeline, string $body): array
    {
        $parts = [];
        $assets = [
            'text' => ['has' => filled($body)],
            'image' => ['has' => filled($pipeline->thumbnail_path), 'path' => $pipeline->thumbnail_path, 'wa_type' => 'image'],
            'video' => ['has' => filled($pipeline->video_path), 'path' => $pipeline->video_path, 'wa_type' => 'video'],
            'audio' => ['has' => filled($pipeline->voiceover_path), 'path' => $pipeline->voiceover_path, 'wa_type' => 'audio'],
        ];

        foreach (['text', 'image', 'video', 'audio'] as $key) {
            if (! in_array($key, $sendParts, true)) continue;
            if (! ($assets[$key]['has'] ?? false)) continue;

            if ($key === 'text') {
                $parts[] = ['type' => 'text', 'body' => $body];
            } else {
                $parts[] = [
                    'type' => $key,
                    'wa_type' => $assets[$key]['wa_type'],
                    'media_url' => $this->publicUrlFor($assets[$key]['path']),
                ];
            }
        }
        return $parts;
    }

    protected function publicUrlFor(string $absolutePath): string
    {
        $storagePath = storage_path('app/public/');
        if (str_starts_with($absolutePath, $storagePath)) {
            $rel = substr($absolutePath, strlen($storagePath));
            return rtrim(config('app.url'), '/') . '/storage/' . ltrim($rel, '/');
        }
        return rtrim(config('app.url'), '/') . '/storage/' . ltrim(basename(dirname($absolutePath)) . '/' . basename($absolutePath), '/');
    }

    protected function logOutbound(Campaign $campaign, Contact $contact, string $provider, string $type, string $body, ?string $mediaUrl): Message
    {
        return Message::create([
            'user_id' => $campaign->user_id,
            'campaign_id' => $campaign->id,
            'contact_id' => $contact->id,
            'direction' => 'outbound',
            'to_phone' => $contact->phone,
            'provider' => $provider,
            'type' => $type,
            'body' => $body,
            'media_url' => $mediaUrl,
            'status' => Message::STATUS_SENDING,
        ]);
    }

    protected function markSent(Message $message, array $result, Campaign $campaign, Contact $contact): void
    {
        $message->update([
            'provider_message_id' => $result['provider_message_id'] ?? null,
            'status' => Message::STATUS_SENT,
            'sent_at' => now(),
            'payload' => $result['raw'] ?? null,
        ]);
        $campaign->increment('sent_count');
        $contact->update(['last_messaged_at' => now()]);
    }

    protected function renderBody(string $tpl, Contact $contact): string
    {
        return strtr($tpl, [
            '{{name}}' => $contact->name ?? '',
            '{{phone}}' => $contact->phone,
            '{{first_name}}' => $contact->name ? explode(' ', $contact->name)[0] : '',
        ]);
    }
}
