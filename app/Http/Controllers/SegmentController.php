<?php

namespace App\Http\Controllers;

use App\Models\Segment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SegmentController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:16'],
        ]);

        Segment::create([...$data, 'user_id' => $request->user()->id]);
        return back()->with('success', 'Segment created.');
    }

    public function update(Request $request, Segment $segment): RedirectResponse
    {
        abort_unless($segment->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:16'],
        ]);

        $segment->update($data);
        return back()->with('success', 'Segment updated.');
    }

    public function destroy(Request $request, Segment $segment): RedirectResponse
    {
        abort_unless($segment->user_id === $request->user()->id, 403);
        $segment->delete();
        return back()->with('success', 'Segment deleted.');
    }
}
