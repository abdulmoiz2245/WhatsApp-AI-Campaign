<?php

namespace App\Console\Commands;

use App\Jobs\DispatchCampaignJob;
use App\Jobs\PublishScheduledPostJob;
use App\Models\Campaign;
use App\Models\ScheduledPost;
use Carbon\Carbon;
use Illuminate\Console\Command;

class PublishDuePostsCommand extends Command
{
    protected $signature = 'scheduler:publish-due
                            {--dry : Print what would be published without dispatching}';

    protected $description = 'Publish scheduled posts and dispatch campaigns whose time has arrived.';

    public function handle(): int
    {
        $now = Carbon::now();

        // Scheduled posts whose datetime in their stored timezone has arrived.
        $posts = ScheduledPost::where('status', ScheduledPost::STATUS_SCHEDULED)
            ->where('auto_publish', true)
            ->get()
            ->filter(function (ScheduledPost $p) use ($now) {
                $when = Carbon::parse($p->scheduled_for->format('Y-m-d') . ' ' . $p->scheduled_time, $p->timezone);
                return $when->lte($now);
            });

        foreach ($posts as $post) {
            $this->info("Publishing post #{$post->id}: {$post->title}");
            if (! $this->option('dry')) {
                PublishScheduledPostJob::dispatch($post->id);
            }
        }

        // Campaigns scheduled for now or earlier
        $campaigns = Campaign::where('status', Campaign::STATUS_SCHEDULED)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', $now)
            ->get();

        foreach ($campaigns as $campaign) {
            $this->info("Dispatching campaign #{$campaign->id}: {$campaign->name}");
            if (! $this->option('dry')) {
                DispatchCampaignJob::dispatch($campaign->id);
            }
        }

        $this->info("Done. Posts: {$posts->count()}, Campaigns: {$campaigns->count()}");
        return self::SUCCESS;
    }
}
