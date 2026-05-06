<?php

namespace App\Http\Controllers;

use App\Jobs\RunResearchJob;
use App\Models\ResearchTopic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ResearchController extends Controller
{
    public function index(Request $request): Response
    {
        $topics = ResearchTopic::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return Inertia::render('Research/Index', [
            'topics' => $topics,
        ]);
    }

    public function show(Request $request, ResearchTopic $topic): Response
    {
        abort_unless($topic->user_id === $request->user()->id, 403);
        return Inertia::render('Research/Show', ['topic' => $topic]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'topic' => ['required', 'string', 'max:255'],
            'content_type' => ['required', Rule::in(['script', 'blog', 'caption', 'ad'])],
            'tone' => ['required', 'string', 'max:32'],
            'language' => ['required', 'string', 'max:16'],
        ]);

        $topic = ResearchTopic::create([
            ...$data,
            'user_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        RunResearchJob::dispatch($topic->id);

        return redirect()->route('research.show', $topic)->with('success', 'Research started.');
    }

    public function destroy(Request $request, ResearchTopic $topic): RedirectResponse
    {
        abort_unless($topic->user_id === $request->user()->id, 403);
        $topic->delete();
        return back()->with('success', 'Topic removed.');
    }
}
