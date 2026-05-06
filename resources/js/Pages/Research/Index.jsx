import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function ResearchIndex({ topics }) {
    const form = useForm({ topic: '', content_type: 'script', tone: 'professional', language: 'en' });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('research.store'), { onSuccess: () => form.reset() });
    };

    const remove = (t) => confirm('Delete this topic?') && router.delete(route('research.destroy', t.id));

    return (
        <AuthenticatedLayout header={
            <div>
                <h2 className="text-xl font-bold text-gray-800">AI Research</h2>
                <p className="text-gray-400 text-sm">Generate research-backed scripts and outlines.</p>
            </div>
        }>
            <Head title="AI Research" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                    <h3 className="font-semibold text-gray-800">New Research Topic</h3>
                    <textarea rows={3} value={form.data.topic} onChange={(e) => form.setData('topic', e.target.value)}
                              placeholder="e.g. Latest trends in EV charging infrastructure for SMBs"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 resize-none" required/>
                    <div className="grid grid-cols-2 gap-3">
                        <select value={form.data.content_type} onChange={(e) => form.setData('content_type', e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                            <option value="script">Video script</option>
                            <option value="blog">Blog post</option>
                            <option value="caption">Caption</option>
                            <option value="ad">Ad copy</option>
                        </select>
                        <select value={form.data.tone} onChange={(e) => form.setData('tone', e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="energetic">Energetic</option>
                            <option value="educational">Educational</option>
                        </select>
                    </div>
                    <select value={form.data.language} onChange={(e) => form.setData('language', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                        <option value="en">English</option>
                        <option value="ur">Urdu</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="ar">Arabic</option>
                    </select>
                    <button disabled={form.processing} className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
                        {form.processing ? 'Starting…' : 'Start Research'}
                    </button>
                </form>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
                    <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Recent Topics</h3></div>
                    <div className="divide-y divide-gray-50">
                        {topics.data.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No research topics yet.</div>}
                        {topics.data.map((t) => (
                            <div key={t.id} className="px-5 py-4 flex items-center gap-3 group hover:bg-gray-50/50">
                                <div className="flex-1 min-w-0">
                                    <Link href={route('research.show', t.id)} className="font-medium text-gray-800 hover:underline truncate block">{t.topic}</Link>
                                    <div className="text-xs text-gray-500 mt-0.5">{t.content_type} · {t.tone} · {t.language}</div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    t.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                    t.status === 'researching' ? 'bg-blue-50 text-blue-700' :
                                    t.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {t.status}
                                </span>
                                <button onClick={() => remove(t)} className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 transition">Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
