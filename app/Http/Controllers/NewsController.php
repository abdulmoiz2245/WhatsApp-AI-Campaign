<?php

namespace App\Http\Controllers;

use App\Jobs\RunResearchJob;
use App\Models\NewsArticle;
use App\Models\ResearchTopic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewsController extends Controller
{
    public function index(Request $request): Response
    {
        $articles = NewsArticle::query()
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
            'filters' => $request->only('q', 'language', 'category'),
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
}
