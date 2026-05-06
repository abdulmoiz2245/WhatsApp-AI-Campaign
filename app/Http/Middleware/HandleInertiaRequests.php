<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'app' => [
                'name' => config('app.name'),
            ],
            'notifications' => fn () => $this->buildNotifications($request),
        ];
    }

    /**
     * Build the notification dropdown payload — recent campaign deliveries,
     * pipeline jobs running/failed, and inbound replies. Lazy-evaluated.
     */
    protected function buildNotifications(Request $request): array
    {
        $user = $request->user();
        if (! $user) return ['unread' => 0, 'items' => []];

        $items = [];

        $running = \App\Models\PipelineJob::where('user_id', $user->id)
            ->where('status', 'running')
            ->latest()
            ->limit(5)
            ->get(['id', 'title', 'current_stage', 'progress', 'updated_at']);
        foreach ($running as $job) {
            $items[] = [
                'id' => "pipe-{$job->id}",
                'kind' => 'pipeline',
                'title' => "Rendering: {$job->title}",
                'detail' => "Stage: {$job->current_stage} · {$job->progress}%",
                'href' => route('pipeline.show', $job->id),
                'time' => $job->updated_at,
                'tone' => 'info',
            ];
        }

        $failed = \App\Models\PipelineJob::where('user_id', $user->id)
            ->where('status', 'failed')
            ->latest()
            ->limit(3)
            ->get(['id', 'title', 'updated_at']);
        foreach ($failed as $job) {
            $items[] = [
                'id' => "pipe-fail-{$job->id}",
                'kind' => 'pipeline',
                'title' => "Pipeline failed: {$job->title}",
                'detail' => 'Click to inspect',
                'href' => route('pipeline.show', $job->id),
                'time' => $job->updated_at,
                'tone' => 'error',
            ];
        }

        $replies = \App\Models\Message::with('contact:id,name,phone')
            ->where('user_id', $user->id)
            ->where('direction', 'inbound')
            ->latest()
            ->limit(5)
            ->get(['id', 'contact_id', 'body', 'created_at']);
        foreach ($replies as $m) {
            $items[] = [
                'id' => "msg-{$m->id}",
                'kind' => 'reply',
                'title' => 'Inbound reply from ' . ($m->contact?->name ?? $m->contact?->phone ?? 'unknown'),
                'detail' => mb_substr((string) $m->body, 0, 80),
                'href' => $m->contact_id ? route('contacts.show', $m->contact_id) : '#',
                'time' => $m->created_at,
                'tone' => 'success',
            ];
        }

        // newest first
        usort($items, fn ($a, $b) => strcmp((string) $b['time'], (string) $a['time']));

        return [
            'unread' => count($items),
            'items' => array_slice($items, 0, 10),
        ];
    }
}
