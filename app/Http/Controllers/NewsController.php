<?php

namespace App\Http\Controllers;

use App\Jobs\RunResearchJob;
use App\Models\NewsArticle;
use App\Models\ResearchTopic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class NewsController extends Controller
{
    public function index(Request $request): Response
    {
        $showArchived = $request->boolean('archived');

        $articles = NewsArticle::query()
            ->when($showArchived,
                fn ($q) => $q->whereNotNull('archived_at'),
                fn ($q) => $q->whereNull('archived_at'),
            )
            ->when($request->filled('language'), fn ($q) => $q->where('language', $request->language))
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->category))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%' . $request->string('q') . '%';
                $q->where(fn ($x) => $x->where('title', 'like', $term)->orWhere('summary', 'like', $term));
            })
            ->orderByDesc('trending')
            ->orderByDesc('published_at')
            ->paginate(24)
            ->withQueryString();

        $categories = NewsArticle::query()
            ->select('category')->whereNotNull('category')->groupBy('category')
            ->pluck('category');

        return Inertia::render('News/Index', [
            'articles' => $articles,
            'categories' => $categories,
            'filters' => $request->only('q', 'language', 'category', 'archived'),
            'counts' => [
                'active' => NewsArticle::whereNull('archived_at')->count(),
                'archived' => NewsArticle::whereNotNull('archived_at')->count(),
            ],
        ]);
    }

    public function research(Request $request, NewsArticle $news): RedirectResponse
    {
        $topic = ResearchTopic::create([
            'user_id' => $request->user()->id,
            'news_article_id' => $news->id,
            'topic' => $news->title,
            'content_type' => 'video',
            'tone' => 'professional',
            'language' => $news->language,
            'depth' => 'standard',
            'audience_language' => $news->language === 'ur' ? 'ur' : 'en',
            'status' => 'pending',
            'metadata' => ['source' => $news->source, 'source_url' => $news->source_url],
        ]);

        RunResearchJob::dispatch($topic->id);

        return redirect()->route('research.show', $topic)->with('success', 'Research started for: ' . $news->title);
    }

    public function archive(NewsArticle $news): RedirectResponse
    {
        $news->update(['archived_at' => now()]);

        return back()->with('success', 'Article archived.');
    }

    public function unarchive(NewsArticle $news): RedirectResponse
    {
        $news->update(['archived_at' => null]);

        return back()->with('success', 'Article restored.');
    }

    public function archiveAll(): RedirectResponse
    {
        $count = NewsArticle::whereNull('archived_at')->update(['archived_at' => now()]);

        return back()->with('success', "Archived {$count} article(s).");
    }

    public function archiveBulk(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:news_articles,id',
        ]);

        $count = NewsArticle::whereIn('id', $data['ids'])
            ->whereNull('archived_at')
            ->update(['archived_at' => now()]);

        return back()->with('success', "Archived {$count} article(s).");
    }

    public function fetch(Request $request): RedirectResponse
    {
        try {
            Artisan::call('news:ingest', ['--limit' => (int) $request->input('limit', 30)]);
            $output = trim(Artisan::output());

            return back()->with('success', 'Fetched latest feeds. ' . $output);
        } catch (\Throwable $e) {
            return back()->with('error', 'Feed fetch failed: ' . $e->getMessage());
        }
    }
}
