<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DispatchCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $campaignId) {}

    public function handle(): void
    {
        $campaign = Campaign::with('segment')->findOrFail($this->campaignId);

        if (! in_array($campaign->status, [Campaign::STATUS_DRAFT, Campaign::STATUS_SCHEDULED, Campaign::STATUS_PAUSED], true)) {
            return;
        }

        $query = Contact::query()
            ->where('user_id', $campaign->user_id)
            ->where('status', 'active');

        if ($campaign->segment_id) {
            $query->whereHas('segments', fn ($q) => $q->where('segments.id', $campaign->segment_id));
        }

        $total = (clone $query)->count();

        $campaign->update([
            'status' => Campaign::STATUS_ACTIVE,
            'started_at' => now(),
            'total_recipients' => $total,
        ]);

        $query->chunkById(200, function ($contacts) use ($campaign) {
            foreach ($contacts as $contact) {
                SendCampaignMessageJob::dispatch($campaign->id, $contact->id);
            }
        });

        // Mark complete-on-empty so the UI is honest. If $total > 0, finalization
        // happens via webhook callbacks updating per-message counts.
        if ($total === 0) {
            $campaign->update(['status' => Campaign::STATUS_COMPLETED, 'completed_at' => now()]);
        }
    }
}
