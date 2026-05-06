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
        $campaign = Campaign::with('user', 'template')->findOrFail($this->campaignId);
        $contact = Contact::findOrFail($this->contactId);

        if ($contact->status !== 'active') {
            return;
        }

        $body = $this->renderBody($campaign->message_body ?? '', $contact);

        $message = Message::create([
            'user_id' => $campaign->user_id,
            'campaign_id' => $campaign->id,
            'contact_id' => $contact->id,
            'direction' => 'outbound',
            'to_phone' => $contact->phone,
            'provider' => $campaign->user->effectiveSettings()->whatsapp_driver ?: config('services.whatsapp.driver'),
            'type' => $campaign->media_url ? ($campaign->media_type ?: 'image') : 'text',
            'body' => $body,
            'media_url' => $campaign->media_url,
            'status' => Message::STATUS_SENDING,
        ]);

        try {
            $driver = $wa->for($campaign->user);

            if ($campaign->template) {
                $result = $driver->sendTemplate(
                    to: $contact->phone,
                    template: $campaign->template->provider_template_name ?: $campaign->template->name,
                    language: $campaign->template->language ?: 'en_US',
                );
            } elseif ($campaign->media_url) {
                $result = $driver->sendMedia(
                    to: $contact->phone,
                    mediaUrl: $campaign->media_url,
                    type: $campaign->media_type ?: 'image',
                    caption: $body ?: null,
                );
            } else {
                $result = $driver->sendText($contact->phone, $body);
            }

            $message->update([
                'provider_message_id' => $result['provider_message_id'] ?? null,
                'status' => Message::STATUS_SENT,
                'sent_at' => now(),
                'payload' => $result['raw'] ?? null,
            ]);

            $campaign->increment('sent_count');
            $contact->update(['last_messaged_at' => now()]);
        } catch (Throwable $e) {
            $message->update([
                'status' => Message::STATUS_FAILED,
                'failed_at' => now(),
                'error' => ['message' => $e->getMessage()],
            ]);
            $campaign->increment('failed_count');
            throw $e;
        }
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
