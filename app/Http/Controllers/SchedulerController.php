<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\PipelineJob;
use App\Models\ScheduledPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SchedulerController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $month = $request->date('month') ?: now()->startOfMonth();
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();

        $posts = ScheduledPost::with(['campaign:id,name'])
            ->where('user_id', $userId)
            ->whereBetween('scheduled_for', [$start->toDateString(), $end->toDateString()])
            ->orderBy('scheduled_for')
            ->orderBy('scheduled_time')
            ->get();

        return Inertia::render('Scheduler/Index', [
            'posts' => $posts,
            'month' => $start->toDateString(),
            'campaigns' => Campaign::where('user_id', $userId)->get(['id', 'name']),
            'pipeline_jobs' => PipelineJob::where('user_id', $userId)->where('status', 'completed')->get(['id', 'title']),
            'settings' => [
                'timezone' => $request->user()->effectiveSettings()->timezone,
                'publish_hour' => $request->user()->effectiveSettings()->publish_hour,
                'publish_minute' => $request->user()->effectiveSettings()->publish_minute,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'caption' => ['nullable', 'string'],
            'scheduled_for' => ['required', 'date'],
            'scheduled_time' => ['nullable', 'date_format:H:i'],
            'campaign_id' => ['nullable', 'exists:campaigns,id'],
            'pipeline_job_id' => ['nullable', 'exists:pipeline_jobs,id'],
            'auto_publish' => ['nullable', 'boolean'],
        ]);

        $s = $request->user()->effectiveSettings();
        $time = $data['scheduled_time'] ?? sprintf('%02d:%02d', $s->publish_hour, $s->publish_minute);

        ScheduledPost::create([
            ...$data,
            'user_id' => $request->user()->id,
            'scheduled_time' => $time,
            'timezone' => $s->timezone,
            'auto_publish' => $data['auto_publish'] ?? true,
            'status' => ScheduledPost::STATUS_SCHEDULED,
        ]);

        return back()->with('success', 'Post scheduled.');
    }

    public function update(Request $request, ScheduledPost $scheduledPost): RedirectResponse
    {
        abort_unless($scheduledPost->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:200'],
            'caption' => ['nullable', 'string'],
            'scheduled_for' => ['nullable', 'date'],
            'scheduled_time' => ['nullable', 'date_format:H:i'],
            'auto_publish' => ['nullable', 'boolean'],
            'status' => ['nullable', Rule::in([
                ScheduledPost::STATUS_SCHEDULED, ScheduledPost::STATUS_CANCELLED,
            ])],
        ]);

        $scheduledPost->update($data);
        return back()->with('success', 'Schedule updated.');
    }

    public function destroy(Request $request, ScheduledPost $scheduledPost): RedirectResponse
    {
        abort_unless($scheduledPost->user_id === $request->user()->id, 403);
        $scheduledPost->delete();
        return back()->with('success', 'Schedule deleted.');
    }
}
