<?php

namespace App\Jobs;

use App\Models\ScheduledPost;
use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Throwable;

class PublishScheduledPostJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $postId) {}

    public function handle(WhatsAppManager $wa): void
    {
        $post = ScheduledPost::with(['user', 'campaign'])->findOrFail($this->postId);

        if ($post->status !== ScheduledPost::STATUS_SCHEDULED) {
            return;
        }

        $post->update(['status' => ScheduledPost::STATUS_PUBLISHING]);

        try {
            // If there's a linked campaign, dispatch it. Otherwise, treat as a
            // status broadcast to all active contacts.
            if ($post->campaign_id) {
                DispatchCampaignJob::dispatch($post->campaign_id);
                $post->update([
                    'status' => ScheduledPost::STATUS_PUBLISHED,
                    'published_at' => now(),
                    'result' => ['mode' => 'campaign_dispatched'],
                ]);
                return;
            }

            // Standalone scheduled post: broadcast media or caption to all active contacts.
            $contacts = $post->user->contacts()->where('status', 'active')->get();
            $driver = $wa->for($post->user);
            $sent = 0;
            $failed = 0;

            $mediaUrl = $post->media_path
                ? Storage::disk('public')->url(str_replace(Storage::disk('public')->path(''), '', $post->media_path))
                : null;

            foreach ($contacts as $contact) {
                try {
                    if ($mediaUrl) {
                        $driver->sendMedia($contact->phone, $mediaUrl, $post->media_type ?: 'video', $post->caption);
                    } else {
                        $driver->sendText($contact->phone, $post->caption ?? '');
                    }
                    $sent++;
                } catch (Throwable $e) {
                    $failed++;
                }
            }

            $post->update([
                'status' => ScheduledPost::STATUS_PUBLISHED,
                'published_at' => now(),
                'result' => ['sent' => $sent, 'failed' => $failed],
            ]);
        } catch (Throwable $e) {
            $post->update([
                'status' => ScheduledPost::STATUS_FAILED,
                'result' => ['error' => $e->getMessage()],
            ]);
            throw $e;
        }
    }
}
