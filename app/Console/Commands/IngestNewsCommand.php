<?php

namespace App\Console\Commands;

use App\Models\NewsArticle;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class IngestNewsCommand extends Command
{
    protected $signature = 'news:ingest {--limit=30 : Articles per source}';
    protected $description = 'Pull latest articles from configured RSS feeds (Dawn, Geo, Express, BBC Urdu, ARY).';

    /**
     * Default Pakistani news RSS sources. Each entry: [source, language, category, url].
     */
    protected array $sources = [
        ['Dawn',      'en', 'top',      'https://www.dawn.com/feeds/home'],
        ['BBC Urdu',  'ur', 'top',      'https://feeds.bbci.co.uk/urdu/rss.xml'],
        ['Geo',       'ur', 'top',      'https://www.geo.tv/rss/1/1'],
        ['Express',   'ur', 'top',      'https://www.express.pk/feed/'],
        ['ARY',       'en', 'top',      'https://arynews.tv/feed/'],
    ];

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $totalIngested = 0;

        foreach ($this->sources as [$source, $language, $category, $url]) {
            $this->info("Fetching {$source} ({$language})…");
            try {
                $resp = Http::timeout(15)->get($url);
                if (! $resp->successful()) {
                    $this->warn("  HTTP {$resp->status()}; skipping.");
                    continue;
                }
                $items = $this->parseRss($resp->body(), $limit);
                foreach ($items as $item) {
                    $existed = NewsArticle::where('external_id', $item['external_id'])->exists();
                    NewsArticle::updateOrCreate(
                        ['external_id' => $item['external_id']],
                        [
                            'source' => $source,
                            'source_url' => $item['link'],
                            'language' => $language,
                            'category' => $category,
                            'region' => 'PK',
                            'title' => $item['title'],
                            'summary' => $item['summary'],
                            'image_url' => $item['image'] ?? null,
                            'published_at' => $item['published_at'],
                            'trending' => false,
                        ]
                    );
                    if (! $existed) $totalIngested++;
                }
                $this->info("  Got " . count($items) . " items.");
            } catch (\Throwable $e) {
                $this->warn("  Failed: {$e->getMessage()}");
            }
        }

        $this->info("Done. Ingested {$totalIngested} new articles.");
        return self::SUCCESS;
    }

    protected function parseRss(string $xml, int $limit): array
    {
        $items = [];
        try {
            $sx = @simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        } catch (\Throwable) { return []; }
        if (! $sx) return [];

        $entries = $sx->channel->item ?? $sx->entry ?? [];
        $i = 0;
        foreach ($entries as $entry) {
            if ($i++ >= $limit) break;
            $title = trim((string) ($entry->title ?? ''));
            $link = trim((string) ($entry->link ?? $entry->guid ?? ''));
            if ($title === '' || $link === '') continue;

            $desc = trim(strip_tags((string) ($entry->description ?? $entry->summary ?? '')));
            $pub = (string) ($entry->pubDate ?? $entry->published ?? '');
            $published = $pub ? Carbon::parse($pub) : Carbon::now();

            $image = null;
            if (isset($entry->enclosure['url'])) {
                $image = (string) $entry->enclosure['url'];
            }

            $items[] = [
                'external_id' => sha1($link),
                'title' => mb_substr($title, 0, 250),
                'link' => $link,
                'summary' => mb_substr($desc, 0, 1000),
                'image' => $image,
                'published_at' => $published,
            ];
        }
        return $items;
    }
}
