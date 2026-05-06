<?php

namespace App\Http\Controllers;

use App\Jobs\RunPipelineJob;
use App\Models\PipelineJob;
use App\Models\ResearchTopic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PipelineController extends Controller
{
    public function index(Request $request): Response
    {
        $jobs = PipelineJob::with('researchTopic:id,topic')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return Inertia::render('Pipeline/Index', [
            'jobs' => $jobs,
        ]);
    }

    public function show(Request $request, PipelineJob $pipeline): Response
    {
        abort_unless($pipeline->user_id === $request->user()->id, 403);
        return Inertia::render('Pipeline/Show', ['job' => $pipeline]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'research_topic_id' => ['nullable', 'exists:research_topics,id'],
            'script' => ['nullable', 'string'],
        ]);

        if (! empty($data['research_topic_id'])) {
            $rt = ResearchTopic::where('user_id', $request->user()->id)->findOrFail($data['research_topic_id']);
            $data['script'] = $data['script'] ?: $rt->script;
        }

        $pipe = PipelineJob::create([
            ...$data,
            'user_id' => $request->user()->id,
            'status' => 'queued',
            'current_stage' => 'script',
        ]);

        RunPipelineJob::dispatch($pipe->id);

        return redirect()->route('pipeline.show', $pipe)->with('success', 'Pipeline started.');
    }

    public function destroy(Request $request, PipelineJob $pipeline): RedirectResponse
    {
        abort_unless($pipeline->user_id === $request->user()->id, 403);
        $pipeline->delete();
        return back()->with('success', 'Pipeline removed.');
    }
}
