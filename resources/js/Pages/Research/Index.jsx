import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

const typeIcon = {
    video: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4"/>,
    image: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>,
    text: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>,
};

const typeBg = { video: 'bg-purple-50 text-purple-500', image: 'bg-amber-50 text-amber-500', text: 'bg-blue-50 text-blue-500' };

const statusPill = (s) => ({
    completed: 'badge-active',
    researching: 'badge-scheduled',
    pending: 'badge-draft',
    failed: 'badge-failed',
}[s] || 'badge-draft');

export default function ResearchIndex({ topics }) {
    const form = useForm({
        topic: '', content_type: 'video', tone: 'professional',
        language: 'ur', depth: 'standard', audience_language: 'ur',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('research.store'), { onSuccess: () => form.reset() });
    };

    const remove = (t) => confirm('Delete this research session?') && router.delete(route('research.destroy', t.id));

    return (
        <AuthenticatedLayout title="AI Research" subtitle="Pakistani news topics → AI researches & creates content → Send on WhatsApp · اے آئی ریسرچ">
            <Head title="AI Research" />

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Left: Topic input + history */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="card p-5">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="w-7 h-7 bg-brand-light rounded-lg flex items-center justify-center text-brand-dark">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                            </span>
                            New Research Request
                        </h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Research Topic (Urdu / English)</label>
                                <input type="text" value={form.data.topic} onChange={(e) => form.setData('topic', e.target.value)}
                                       placeholder="e.g. عمران خان کی حالیہ تقریر / Latest budget highlights"
                                       className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['video', 'image', 'text'].map((t) => (
                                        <label key={t}
                                               className={`flex flex-col items-center gap-1 p-2 border-2 rounded-xl cursor-pointer text-xs font-medium transition ${
                                                   form.data.content_type === t
                                                       ? 'border-brand bg-brand-light text-brand-dark'
                                                       : 'border-gray-200 hover:border-brand text-gray-600'}`}>
                                            <input type="radio" name="ctype" className="sr-only"
                                                   checked={form.data.content_type === t}
                                                   onChange={() => form.setData('content_type', t)}/>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{typeIcon[t]}</svg>
                                            <span className="capitalize">{t}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Depth</label>
                                <select value={form.data.depth} onChange={(e) => form.setData('depth', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="quick">Quick Summary (30 sec video)</option>
                                    <option value="standard">Standard (2-3 min video)</option>
                                    <option value="deep">Deep Dive (5 min video)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Audience Language</label>
                                <select value={form.data.audience_language} onChange={(e) => { form.setData('audience_language', e.target.value); form.setData('language', e.target.value); }}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="ur">Urdu (اردو)</option>
                                    <option value="en">English</option>
                                    <option value="bilingual">Urdu + English (Bilingual)</option>
                                </select>
                            </div>
                            <button disabled={form.processing} className="btn-brand w-full justify-center py-3 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                {form.processing ? 'Starting…' : 'Start AI Research'}
                            </button>
                        </form>
                    </div>

                    <div className="card p-5">
                        <h3 className="font-semibold text-gray-800 mb-3">Past Research Sessions</h3>
                        {topics.data.length === 0 ? (
                            <p className="text-sm text-gray-400">No sessions yet. Start one above or pick a news topic.</p>
                        ) : (
                            <div className="space-y-2">
                                {topics.data.map((t) => (
                                    <Link href={route('research.show', t.id)} key={t.id}
                                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-gray-100 group">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeBg[t.content_type] || 'bg-gray-100 text-gray-500'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{typeIcon[t.content_type] || typeIcon.text}</svg>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-medium text-gray-800 truncate ${t.audience_language === 'ur' ? 'text-right' : ''}`}
                                               dir={t.audience_language === 'ur' ? 'rtl' : 'ltr'}>
                                                {t.topic}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {t.content_type} · {new Date(t.created_at).toLocaleDateString()} · {t.depth || 'standard'}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusPill(t.status)}`}>{t.status}</span>
                                        <button onClick={(e) => { e.preventDefault(); remove(t); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: AI output preview placeholder */}
                <div className="xl:col-span-3 space-y-4">
                    <div className="card p-5">
                        <h3 className="font-semibold text-gray-800 mb-3">Generated Script Preview</h3>
                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed min-h-[180px] border border-dashed border-gray-200 flex items-center justify-center text-center">
                            <p className="text-gray-400 italic">
                                Submit a topic to see the AI-generated script preview here.
                                <br/><span className="text-xs">Or pick a news headline from <Link href="/news" className="text-brand-dark font-medium underline">News Topics</Link>.</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="card p-5">
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                                </svg>
                                Voiceover
                            </h3>
                            <p className="text-xs text-gray-500">ElevenLabs / OpenAI TTS · Male & Female Urdu voices.</p>
                            <div className="mt-3 h-20 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                                Audio preview after research completes
                            </div>
                        </div>
                        <div className="card p-5">
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">{typeIcon.image}</svg>
                                Thumbnail
                            </h3>
                            <p className="text-xs text-gray-500">DALL-E generated thumbnail based on your topic.</p>
                            <div className="mt-3 h-20 rounded-xl flex items-center justify-center text-white text-xs font-semibold"
                                 style={{ background: 'linear-gradient(135deg,#128C7E,#25D366)' }}>
                                AI Generated Preview
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
