<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Contact;
use App\Models\Message;
use App\Models\PipelineJob;
use App\Models\ScheduledPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $userId = $request->user()->id;

        $totalCampaigns = Campaign::where('user_id', $userId)->count();
        $activeCampaigns = Campaign::where('user_id', $userId)->where('status', Campaign::STATUS_ACTIVE)->count();
        $totalContacts = Contact::where('user_id', $userId)->where('status', 'active')->count();
        $messagesSent = Message::where('user_id', $userId)
            ->whereIn('status', [Message::STATUS_SENT, Message::STATUS_DELIVERED, Message::STATUS_READ])
            ->count();
        $deliveredCount = Message::where('user_id', $userId)
            ->whereIn('status', [Message::STATUS_DELIVERED, Message::STATUS_READ])
            ->count();
        $deliveryRate = $messagesSent ? round(($deliveredCount / $messagesSent) * 100, 1) : 0;
        $videosGenerated = PipelineJob::where('user_id', $userId)
            ->where('status', 'completed')->whereNotNull('video_path')->count();

        $trend = Message::query()
            ->selectRaw('DATE(sent_at) as day, COUNT(*) as total')
            ->where('user_id', $userId)
            ->where('sent_at', '>=', now()->subDays(13)->startOfDay())
            ->whereNotNull('sent_at')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy(fn ($r) => $r->day);

        $trendSeries = [];
        for ($i = 13; $i >= 0; $i--) {
            $day = now()->subDays($i)->toDateString();
            $trendSeries[] = ['day' => $day, 'total' => (int) ($trend[$day]->total ?? 0)];
        }

        $byType = Campaign::query()
            ->selectRaw('type, COUNT(*) as total')
            ->where('user_id', $userId)
            ->groupBy('type')
            ->pluck('total', 'type');

        $recentCampaigns = Campaign::where('user_id', $userId)
            ->latest()->limit(6)->get(['id', 'name', 'type', 'status', 'sent_count', 'total_recipients', 'scheduled_at']);

        $recentActivity = Message::with('contact:id,name,phone')
            ->where('user_id', $userId)
            ->latest()
            ->limit(6)
            ->get(['id', 'contact_id', 'status', 'body', 'created_at']);

        return Inertia::render('Dashboard', [
            'kpis' => [
                'total_campaigns' => $totalCampaigns,
                'active_campaigns' => $activeCampaigns,
                'total_contacts' => $totalContacts,
                'messages_sent' => $messagesSent,
                'delivery_rate' => $deliveryRate,
                'videos_generated' => $videosGenerated,
                'pipeline_jobs_running' => PipelineJob::where('user_id', $userId)->where('status', 'running')->count(),
                'scheduled_today' => ScheduledPost::where('user_id', $userId)
                    ->whereDate('scheduled_for', today())
                    ->where('status', ScheduledPost::STATUS_SCHEDULED)
                    ->count(),
            ],
            'trend' => $trendSeries,
            'by_type' => $byType,
            'recent_campaigns' => $recentCampaigns,
            'recent_activity' => $recentActivity,
        ]);
    }
}
