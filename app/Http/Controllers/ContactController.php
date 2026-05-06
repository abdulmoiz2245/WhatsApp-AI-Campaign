<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Segment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $contacts = Contact::with('segments:id,name,color')
            ->where('user_id', $userId)
            ->when($request->string('q')->isNotEmpty(), function ($q) use ($request) {
                $term = '%' . $request->string('q') . '%';
                $q->where(fn ($x) => $x->where('name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            ->when($request->filled('segment'), function ($q) use ($request) {
                $q->whereHas('segments', fn ($x) => $x->where('segments.id', (int) $request->segment));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString();

        $segments = Segment::withCount('contacts')->where('user_id', $userId)->orderBy('name')->get();

        $stats = [
            'total' => Contact::where('user_id', $userId)->count(),
            'active' => Contact::where('user_id', $userId)->where('status', 'active')->count(),
            'opted_out' => Contact::where('user_id', $userId)->where('status', 'opted_out')->count(),
            'segments' => $segments->count(),
        ];

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts,
            'segments' => $segments,
            'stats' => $stats,
            'filters' => $request->only('q', 'segment', 'status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:32'],
            'email' => ['nullable', 'email'],
            'country' => ['nullable', 'string', 'max:64'],
            'language' => ['nullable', 'string', 'max:16'],
            'tags' => ['nullable', 'array'],
            'segments' => ['nullable', 'array'],
            'segments.*' => ['integer', 'exists:segments,id'],
        ]);

        $contact = Contact::create([
            ...collect($data)->except('segments')->all(),
            'user_id' => $request->user()->id,
            'status' => 'active',
        ]);

        if (! empty($data['segments'])) {
            $contact->segments()->sync($data['segments']);
        }

        return back()->with('success', 'Contact created.');
    }

    public function update(Request $request, Contact $contact): RedirectResponse
    {
        $this->authorizeOwn($request, $contact);

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:32'],
            'email' => ['nullable', 'email'],
            'status' => ['required', Rule::in(['active', 'opted_out', 'blocked'])],
            'tags' => ['nullable', 'array'],
            'segments' => ['nullable', 'array'],
            'segments.*' => ['integer', 'exists:segments,id'],
        ]);

        $contact->update(collect($data)->except('segments')->all());
        if (array_key_exists('segments', $data)) {
            $contact->segments()->sync($data['segments'] ?? []);
        }

        return back()->with('success', 'Contact updated.');
    }

    public function destroy(Request $request, Contact $contact): RedirectResponse
    {
        $this->authorizeOwn($request, $contact);
        $contact->delete();
        return back()->with('success', 'Contact deleted.');
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $userId = $request->user()->id;
        $rows = array_map('str_getcsv', file($request->file('file')->getRealPath()));
        $header = array_map('strtolower', array_map('trim', array_shift($rows) ?? []));

        $imported = 0;
        foreach ($rows as $row) {
            if (count($row) === 0 || ($row[0] ?? '') === '') continue;
            $assoc = array_combine($header, $row + array_fill(0, count($header) - count($row), null));
            $phone = trim((string) ($assoc['phone'] ?? ''));
            if (! $phone) continue;

            Contact::updateOrCreate(
                ['user_id' => $userId, 'phone' => $phone],
                [
                    'name' => $assoc['name'] ?? null,
                    'email' => $assoc['email'] ?? null,
                    'country' => $assoc['country'] ?? null,
                    'language' => $assoc['language'] ?? 'en',
                    'status' => 'active',
                ]
            );
            $imported++;
        }

        return back()->with('success', "Imported {$imported} contacts.");
    }

    protected function authorizeOwn(Request $request, Contact $contact): void
    {
        abort_unless($contact->user_id === $request->user()->id, 403);
    }
}
