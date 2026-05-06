<?php

namespace App\Http\Controllers;

use App\Jobs\DispatchCampaignJob;
use App\Models\Campaign;
use App\Models\MessageTemplate;
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

        $campaigns = Campaign::with(['segment:id,name', 'template:id,name'])
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

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns,
            'segments' => Segment::where('user_id', $userId)->get(['id', 'name']),
            'templates' => MessageTemplate::where('user_id', $userId)->get(['id', 'name']),
            'filters' => $request->only('q', 'status', 'type'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateCampaign($request);
        Campaign::create([...$data, 'user_id' => $request->user()->id]);
        return back()->with('success', 'Campaign created.');
    }

    public function update(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeOwn($request, $campaign);
        $campaign->update($this->validateCampaign($request));
        return back()->with('success', 'Campaign updated.');
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
        return back()->with('success', 'Campaign resumed.');
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
