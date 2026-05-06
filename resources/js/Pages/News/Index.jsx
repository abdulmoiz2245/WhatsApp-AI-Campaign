import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

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

export default function NewsIndex({ articles, categories, filters }) {
    const research = (article) => router.post(route('news.research', article.id));

    return (
        <AuthenticatedLayout title="News Topics" subtitle="پاکستانی خبریں · Pick a story → AI researches → publish on WhatsApp">
            <Head title="News" />

            <div className="card px-4 py-3 flex flex-wrap gap-3 items-center">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {articles.data.length === 0 && (
                    <div className="card p-8 text-center col-span-full text-gray-400 text-sm">
                        No news articles yet. Run <code className="bg-gray-100 px-1.5 py-0.5 rounded">php artisan news:ingest</code> to pull RSS feeds.
                    </div>
                )}

                {articles.data.map((a) => (
                    <article key={a.id} className="card p-5 flex flex-col gap-3 hover:shadow-md transition">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sourceColor[a.source] || 'bg-gray-100 text-gray-700'}`}>{a.source}</span>
                            {a.trending && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">🔥 Trending</span>}
                            {a.category && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{a.category}</span>}
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

                        <div className="mt-auto pt-2 flex gap-2 items-center">
                            <button onClick={() => research(a)} className="btn-brand text-xs py-1.5 px-3">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                Research with AI
                            </button>
                            {a.source_url && (
                                <a href={a.source_url} target="_blank" rel="noreferrer" className="btn-outline text-xs py-1.5 px-3">
                                    Read source
                                </a>
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
