<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Message;
use App\Models\WebhookEvent;
use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as IlluminateResponse;

class WhatsAppWebhookController extends Controller
{
    public function __construct(protected WhatsAppManager $manager) {}

    public function verify(Request $request): IlluminateResponse|JsonResponse
    {
        $driver = $this->manager->default();
        $challenge = $driver->verifyWebhook(
            query: [
                'hub_mode' => $request->query('hub_mode'),
                'hub_verify_token' => $request->query('hub_verify_token'),
                'hub_challenge' => $request->query('hub_challenge'),
            ],
            signature: $request->header('X-Hub-Signature-256'),
            rawBody: '',
        );

        if ($challenge === false) {
            return response()->json(['error' => 'verification_failed'], 403);
        }

        return response((string) $challenge, 200);
    }

    public function handle(Request $request): JsonResponse
    {
        $driver = $this->manager->default();
        $payload = $request->all();

        $event = WebhookEvent::create([
            'provider' => $driver->name(),
            'event_type' => 'whatsapp',
            'payload' => $payload,
        ]);

        try {
            $parsed = $driver->parseWebhook($payload);
            foreach ($parsed['events'] ?? [] as $e) {
                $this->applyEvent($e);
            }
            $event->update(['processed' => true, 'processed_at' => now()]);
        } catch (\Throwable $ex) {
            $event->update(['error' => ['message' => $ex->getMessage()]]);
        }

        // Always 200 to avoid provider retry storms; we've persisted the event.
        return response()->json(['ok' => true]);
    }

    protected function applyEvent(array $e): void
    {
        $messageId = $e['provider_message_id'] ?? null;
        if (! $messageId) return;

        $msg = Message::where('provider_message_id', $messageId)->first();

        if ($e['type'] === 'status' && $msg) {
            $status = $e['status'] ?? null;
            $update = [];

            switch ($status) {
                case 'sent':
                    $update['status'] = Message::STATUS_SENT;
                    $update['sent_at'] = $update['sent_at'] ?? now();
                    break;
                case 'delivered':
                    $update['status'] = Message::STATUS_DELIVERED;
                    $update['delivered_at'] = now();
                    if ($msg->campaign_id) Campaign::where('id', $msg->campaign_id)->increment('delivered_count');
                    break;
                case 'read':
                    $update['status'] = Message::STATUS_READ;
                    $update['read_at'] = now();
                    if ($msg->campaign_id) Campaign::where('id', $msg->campaign_id)->increment('read_count');
                    break;
                case 'failed':
                case 'undelivered':
                    $update['status'] = Message::STATUS_FAILED;
                    $update['failed_at'] = now();
                    $update['error'] = $e['raw'] ?? null;
                    if ($msg->campaign_id) Campaign::where('id', $msg->campaign_id)->increment('failed_count');
                    break;
            }

            if ($update) $msg->update($update);
        }

        if ($e['type'] === 'message') {
            // Inbound reply
            Message::create([
                'user_id' => $msg?->user_id ?? 1,
                'campaign_id' => $msg?->campaign_id,
                'contact_id' => $msg?->contact_id,
                'direction' => 'inbound',
                'from_phone' => $e['from'] ?? null,
                'provider' => app(WhatsAppManager::class)->default()->name(),
                'provider_message_id' => $messageId,
                'type' => 'text',
                'body' => $e['body'] ?? null,
                'status' => 'received',
                'payload' => $e['raw'] ?? null,
            ]);
            if ($msg && $msg->campaign_id) {
                Campaign::where('id', $msg->campaign_id)->increment('replied_count');
            }
        }
    }
}
