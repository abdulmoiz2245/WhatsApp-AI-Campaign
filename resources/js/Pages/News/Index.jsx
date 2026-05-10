import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const fmtAge = (iso) => {
    if (!iso) return '';
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const sourceColor = {
    'Geo': 'bg-red-50 text-red-700',
    'Dawn': 'bg-blue-50 text-blue-700',
    'Express': 'bg-amber-50 text-amber-700',
    'BBC Urdu': 'bg-rose-50 text-rose-700',
    'ARY': 'bg-emerald-50 text-emerald-700',
};

export default function NewsIndex({ articles, categories, filters, counts }) {
    const [fetching, setFetching] = useState(false);
    const [selected, setSelected] = useState([]);
    const showArchived = !!filters.archived;

    useEffect(() => { setSelected([]); }, [articles]);

    const pageIds = useMemo(
        () => articles.data.filter((a) => !a.archived_at).map((a) => a.id),
        [articles.data],
    );
    const allSelected = pageIds.length > 0 && selected.length === pageIds.length;
    const someSelected = selected.length > 0 && !allSelected;

    const toggleOne = (id) =>
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    const toggleAll = () => setSelected(allSelected ? [] : pageIds);

    const research = (article) => router.post(route('news.research', article.id));

    const archive = (article) => router.post(route('news.archive', article.id), {}, { preserveScroll: true });
    const unarchive = (article) => router.post(route('news.unarchive', article.id), {}, { preserveScroll: true });

    const archiveSelected = () => {
        if (selected.length === 0) return;
        if (!confirm(`Archive ${selected.length} selected article(s)?`)) return;
        router.post(route('news.archiveBulk'), { ids: selected }, { preserveScroll: true });
    };

    const fetchFeeds = () => {
        setFetching(true);
        router.post(route('news.fetch'), {}, {
            preserveScroll: true,
            onFinish: () => setFetching(false),
        });
    };

    const archiveAll = () => {
        if (!confirm('Archive all active articles? Move them out of view.')) return;
        router.post(route('news.archiveAll'), {}, { preserveScroll: true });
    };

    const setTab = (archived) => router.get('/news', { ...filters, archived: archived ? 1 : undefined }, { preserveState: true });

    return (
        <AuthenticatedLayout title="News Topics" subtitle="پاکستانی خبریں · Pick a story → AI researches → publish on WhatsApp">
            <Head title="News" />

            <div className="card px-4 py-3 flex flex-wrap gap-3 items-center">
                <div className="flex rounded-xl bg-gray-100 p-1 text-sm">
                    <button onClick={() => setTab(false)}
                            className={`px-3 py-1.5 rounded-lg ${!showArchived ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                        Active <span className="ml-1 text-xs text-gray-400">{counts?.active ?? 0}</span>
                    </button>
                    <button onClick={() => setTab(true)}
                            className={`px-3 py-1.5 rounded-lg ${showArchived ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                        Archived <span className="ml-1 text-xs text-gray-400">{counts?.archived ?? 0}</span>
                    </button>
                </div>

                <input type="text" defaultValue={filters.q || ''}
                       onKeyDown={(e) => e.key === 'Enter' && router.get('/news', { ...filters, q: e.target.value }, { preserveState: true })}
                       placeholder="Search headlines… عنوانات تلاش کریں"
                       className="border border-gray-200 rounded-xl text-sm px-3 py-2 flex-1 min-w-[240px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand"/>
                <select defaultValue={filters.language || ''}
                        onChange={(e) => router.get('/news', { ...filters, language: e.target.value }, { preserveState: true })}
                        className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 text-gray-600">
                    <option value="">All languages</option>
                    <option value="ur">اردو (Urdu)</option>
                    <option value="en">English</option>
                </select>
                <select defaultValue={filters.category || ''}
                        onChange={(e) => router.get('/news', { ...filters, category: e.target.value }, { preserveState: true })}
                        className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 text-gray-600">
                    <option value="">All categories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="ml-auto flex gap-2">
                    <button onClick={fetchFeeds} disabled={fetching}
                            className="btn-brand text-xs py-1.5 px-3 disabled:opacity-60">
                        {fetching ? 'Fetching…' : '↻ Fetch new feed'}
                    </button>
                    {!showArchived && (counts?.active ?? 0) > 0 && (
                        <button onClick={archiveAll} className="btn-outline text-xs py-1.5 px-3">
                            Archive all
                        </button>
                    )}
                </div>
            </div>

            {!showArchived && pageIds.length > 0 && (
                <div className="card px-4 py-2 flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox"
                               checked={allSelected}
                               ref={(el) => { if (el) el.indeterminate = someSelected; }}
                               onChange={toggleAll}
                               className="rounded border-gray-300 text-brand focus:ring-brand"/>
                        <span className="text-gray-600">
                            {selected.length > 0
                                ? `${selected.length} selected`
                                : `Select all on page (${pageIds.length})`}
                        </span>
                    </label>
                    {selected.length > 0 && (
                        <>
                            <button onClick={archiveSelected} className="btn-brand text-xs py-1.5 px-3">
                                Archive selected
                            </button>
                            <button onClick={() => setSelected([])} className="text-xs text-gray-500 hover:text-gray-700">
                                Clear
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {articles.data.length === 0 && (
                    <div className="card p-8 text-center col-span-full text-gray-400 text-sm">
                        {showArchived
                            ? 'No archived articles.'
                            : <>No news articles yet. Click <b>Fetch new feed</b> or run <code className="bg-gray-100 px-1.5 py-0.5 rounded">php artisan news:ingest</code>.</>}
                    </div>
                )}

                {articles.data.map((a) => (
                    <article key={a.id} className={`card p-5 flex flex-col gap-3 hover:shadow-md transition ${selected.includes(a.id) ? 'ring-2 ring-brand' : ''}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                            {!a.archived_at && (
                                <input type="checkbox"
                                       checked={selected.includes(a.id)}
                                       onChange={() => toggleOne(a.id)}
                                       className="rounded border-gray-300 text-brand focus:ring-brand"/>
                            )}
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sourceColor[a.source] || 'bg-gray-100 text-gray-700'}`}>{a.source}</span>
                            {a.trending && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">🔥 Trending</span>}
                            {a.category && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{a.category}</span>}
                            {a.archived_at && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Archived</span>}
                            <span className="ml-auto text-xs text-gray-400">{fmtAge(a.published_at)}</span>
                        </div>

                        <h3 className={`font-semibold text-gray-800 leading-snug ${a.language === 'ur' ? 'text-right' : ''}`} dir={a.language === 'ur' ? 'rtl' : 'ltr'}>
                            {a.title}
                        </h3>

                        {a.summary && (
                            <p className={`text-sm text-gray-500 line-clamp-3 ${a.language === 'ur' ? 'text-right' : ''}`} dir={a.language === 'ur' ? 'rtl' : 'ltr'}>
                                {a.summary}
                            </p>
                        )}

                        <div className="mt-auto pt-2 flex gap-2 items-center flex-wrap">
                            {!a.archived_at && (
                                <button onClick={() => research(a)} className="btn-brand text-xs py-1.5 px-3">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                    </svg>
                                    Research with AI
                                </button>
                            )}
                            {a.source_url && (
                                <a href={a.source_url} target="_blank" rel="noreferrer" className="btn-outline text-xs py-1.5 px-3">
                                    Read source
                                </a>
                            )}
                            {a.archived_at ? (
                                <button onClick={() => unarchive(a)} className="btn-outline text-xs py-1.5 px-3 ml-auto">
                                    Restore
                                </button>
                            ) : (
                                <button onClick={() => archive(a)} className="btn-outline text-xs py-1.5 px-3 ml-auto text-gray-500">
                                    Archive
                                </button>
                            )}
                        </div>
                    </article>
                ))}
            </div>

            {articles.links && articles.last_page > 1 && (
                <div className="flex justify-center gap-1 text-sm">
                    {articles.links.map((l, i) => (
                        <Link key={i} href={l.url || ''} preserveScroll
                              className={`px-3 py-1.5 rounded-lg ${l.active ? 'bg-brand text-white' : 'hover:bg-gray-100 text-gray-600'} ${!l.url ? 'opacity-30 pointer-events-none' : ''}`}
                              dangerouslySetInnerHTML={{ __html: l.label }} />
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
