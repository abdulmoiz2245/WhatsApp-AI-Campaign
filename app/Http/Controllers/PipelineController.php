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
            'enabled_stages' => ['nullable', 'array'],
            'enabled_stages.voiceover' => ['nullable', 'boolean'],
            'enabled_stages.thumbnail' => ['nullable', 'boolean'],
            'enabled_stages.video' => ['nullable', 'boolean'],
            'enabled_stages.upload' => ['nullable', 'boolean'],
        ]);

        $stagesFromRequest = $data['enabled_stages'] ?? null;
        unset($data['enabled_stages']);

        $stagesFromTopic = null;
        if (! empty($data['research_topic_id'])) {
            $rt = ResearchTopic::where('user_id', $request->user()->id)->findOrFail($data['research_topic_id']);
            $data['script'] = $data['script'] ?: $rt->script;
            $stagesFromTopic = $rt->enabled_stages;
        }

        $enabled = array_merge(
            ResearchTopic::defaultEnabledStages(),
            $stagesFromTopic ?? [],
            $stagesFromRequest ?? []
        );

        $pipe = PipelineJob::create([
            ...$data,
            'user_id' => $request->user()->id,
            'status' => 'queued',
            'current_stage' => 'script',
            'enabled_stages' => $enabled,
        ]);

        RunPipelineJob::dispatch($pipe->id);

        return redirect()->route('pipeline.show', $pipe)->with('success', 'Pipeline started.');
    }

    public function retry(Request $request, PipelineJob $pipeline): RedirectResponse
    {
        abort_unless($pipeline->user_id === $request->user()->id, 403);
        abort_unless($pipeline->status === 'failed', 422, 'Only failed pipelines can be retried.');

        $resumeFrom = $pipeline->error['stage'] ?? $pipeline->current_stage ?? 'script';

        $pipeline->update([
            'status' => 'queued',
            'error' => null,
            'current_stage' => $resumeFrom,
        ]);

        RunPipelineJob::dispatch($pipeline->id);

        return back()->with('success', "Pipeline resumed from stage: {$resumeFrom}.");
    }

    public function destroy(Request $request, PipelineJob $pipeline): RedirectResponse
    {
        abort_unless($pipeline->user_id === $request->user()->id, 403);
        $pipeline->delete();
        return back()->with('success', 'Pipeline removed.');
    }

    public function updateScript(Request $request, PipelineJob $pipeline): RedirectResponse
    {
        abort_unless($pipeline->user_id === $request->user()->id, 403);
        abort_if(in_array($pipeline->status, ['queued', 'running'], true), 422, 'Cannot edit while pipeline is running.');

        $data = $request->validate(['script' => ['required', 'string', 'min:5', 'max:10000']]);
        $pipeline->update(['script' => $data['script']]);

        return back()->with('success', 'Script saved.');
    }

    public function regenerate(Request $request, PipelineJob $pipeline, string $stage): RedirectResponse
    {
        abort_unless($pipeline->user_id === $request->user()->id, 403);
        abort_unless(in_array($stage, ['script', 'voiceover', 'thumbnail', 'video', 'upload'], true), 422, 'Invalid stage.');
        abort_if(in_array($pipeline->status, ['queued', 'running'], true), 422, 'Pipeline already running.');

        $order = PipelineJob::STAGES; // [script, voiceover, video, thumbnail, upload, done]
        $idx = array_search($stage, $order, true);
        $toClear = array_slice($order, $idx);

        $stages = $pipeline->stages ?? [];
        foreach ($toClear as $s) {
            unset($stages[$s]);
        }

        $resets = ['stages' => $stages];
        if (in_array('voiceover', $toClear, true)) {
            $resets['voiceover_path'] = null;
            $resets['voiceover_duration_ms'] = null;
        }
        if (in_array('thumbnail', $toClear, true)) $resets['thumbnail_path'] = null;
        if (in_array('video', $toClear, true)) $resets['video_path'] = null;
        if (in_array('upload', $toClear, true)) $resets['whatsapp_media_id'] = null;

        $pipeline->update([
            ...$resets,
            'status' => 'queued',
            'current_stage' => $stage,
            'error' => null,
        ]);

        RunPipelineJob::dispatch($pipeline->id);

        return back()->with('success', "Regenerating from {$stage}.");
    }
}
