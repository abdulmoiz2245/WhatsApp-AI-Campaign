<?php

namespace App\Http\Controllers;

use App\Jobs\DispatchCampaignJob;
use App\Models\Campaign;
use App\Models\MessageTemplate;
use App\Models\PipelineJob;
use App\Models\ResearchTopic;
use App\Models\Segment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $campaigns = Campaign::with(['segment:id,name', 'template:id,name', 'researchTopic:id,topic'])
            ->where('user_id', $userId)
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%' . $request->string('q') . '%';
                $q->where('name', 'like', $term);
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $researchTopics = ResearchTopic::where('user_id', $userId)
            ->latest()
            ->get(['id', 'topic', 'script', 'thumbnail_path'])
            ->map(function ($t) {
                $jobs = PipelineJob::where('research_topic_id', $t->id)
                    ->latest()
                    ->get(['id', 'voiceover_path', 'video_path', 'thumbnail_path', 'script']);
                $pick = fn (string $col) => optional($jobs->firstWhere(fn ($j) => filled($j->$col)))->$col;
                $script = $pick('script') ?: $t->script;
                $thumb = $pick('thumbnail_path') ?: $t->thumbnail_path;
                $video = $pick('video_path');
                $audio = $pick('voiceover_path');
                return [
                    'id' => $t->id,
                    'topic' => $t->topic,
                    'script' => $script,
                    'pipeline_job_id' => $jobs->first()?->id,
                    'has_text' => filled($script),
                    'has_image' => filled($thumb),
                    'has_video' => filled($video),
                    'has_audio' => filled($audio),
                ];
            });

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns,
            'segments' => Segment::where('user_id', $userId)->get(['id', 'name']),
            'templates' => MessageTemplate::where('user_id', $userId)->get(['id', 'name']),
            'researchTopics' => $researchTopics,
            'filters' => $request->only('q', 'status', 'type'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateCampaign($request);
        $data = $this->applyResearchTopic($request, $data);
        Campaign::create([...$data, 'user_id' => $request->user()->id]);
        return back()->with('success', 'Campaign created.');
    }

    public function update(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeOwn($request, $campaign);
        $data = $this->validateCampaign($request);
        $data = $this->applyResearchTopic($request, $data);

        $wasActive = $campaign->status === Campaign::STATUS_ACTIVE;
        $campaign->update($data);

        if (! $wasActive && ($data['status'] ?? null) === Campaign::STATUS_ACTIVE) {
            DispatchCampaignJob::dispatch($campaign->id);
            return back()->with('success', 'Campaign updated and queued for delivery.');
        }

        return back()->with('success', 'Campaign updated.');
    }

    protected function applyResearchTopic(Request $request, array $data): array
    {
        if (empty($data['research_topic_id'])) {
            $data['pipeline_job_id'] = null;
            return $data;
        }

        $topic = ResearchTopic::where('user_id', $request->user()->id)->findOrFail($data['research_topic_id']);
        $latest = PipelineJob::where('research_topic_id', $topic->id)
            ->latest()
            ->first();

        $data['pipeline_job_id'] = $latest?->id;
        if (empty($data['message_body'])) {
            $data['message_body'] = $latest?->script ?: $topic->script;
        }
        return $data;
    }

    public function destroy(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeOwn($request, $campaign);
        $campaign->delete();
        return back()->with('success', 'Campaign deleted.');
    }

    public function start(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeOwn($request, $campaign);
        DispatchCampaignJob::dispatch($campaign->id);
        return back()->with('success', 'Campaign queued for delivery.');
    }

    public function resend(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeOwn($request, $campaign);
        // Reset to scheduled so DispatchCampaignJob's status guard allows re-fanout.
        $campaign->update([
            'status' => Campaign::STATUS_SCHEDULED,
            'started_at' => null,
            'completed_at' => null,
        ]);
        DispatchCampaignJob::dispatch($campaign->id);
        return back()->with('success', 'Campaign queued for resend.');
    }

    public function pause(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeOwn($request, $campaign);
        $campaign->update(['status' => Campaign::STATUS_PAUSED]);
        return back()->with('success', 'Campaign paused.');
    }

    public function resume(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeOwn($request, $campaign);
        $campaign->update(['status' => Campaign::STATUS_ACTIVE]);
        DispatchCampaignJob::dispatch($campaign->id);
        return back()->with('success', 'Campaign resumed and queued.');
    }

    public function bulk(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['pause', 'resume', 'delete'])],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:campaigns,id'],
        ]);

        $query = Campaign::where('user_id', $request->user()->id)->whereIn('id', $data['ids']);

        if ($data['action'] === 'pause') {
            $query->whereIn('status', [Campaign::STATUS_ACTIVE, Campaign::STATUS_SCHEDULED])
                  ->update(['status' => Campaign::STATUS_PAUSED]);
            return back()->with('success', count($data['ids']) . ' campaign(s) paused.');
        }
        if ($data['action'] === 'resume') {
            $query->where('status', Campaign::STATUS_PAUSED)
                  ->update(['status' => Campaign::STATUS_ACTIVE]);
            return back()->with('success', count($data['ids']) . ' campaign(s) resumed.');
        }
        $query->delete();
        return back()->with('success', count($data['ids']) . ' campaign(s) deleted.');
    }

    protected function validateCampaign(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'type' => ['required', Rule::in(['promotional', 'transactional', 'broadcast', 'drip'])],
            'status' => ['nullable', Rule::in([
                Campaign::STATUS_DRAFT, Campaign::STATUS_SCHEDULED, Campaign::STATUS_ACTIVE,
                Campaign::STATUS_PAUSED, Campaign::STATUS_COMPLETED, Campaign::STATUS_FAILED,
            ])],
            'segment_id' => ['nullable', 'exists:segments,id'],
            'template_id' => ['nullable', 'exists:message_templates,id'],
            'research_topic_id' => ['nullable', 'exists:research_topics,id'],
            'send_parts' => ['nullable', 'array'],
            'send_parts.*' => [Rule::in(Campaign::SEND_PARTS)],
            'message_body' => ['nullable', 'string'],
            'media_url' => ['nullable', 'url'],
            'media_type' => ['nullable', Rule::in(['image', 'video', 'document', 'audio'])],
            'scheduled_at' => ['nullable', 'date'],
        ]);
    }

    protected function authorizeOwn(Request $request, Campaign $campaign): void
    {
        abort_unless($campaign->user_id === $request->user()->id, 403);
    }
}
