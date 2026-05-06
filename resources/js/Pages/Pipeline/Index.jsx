import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const statusBadge = (s) => ({
    queued: 'badge-draft',
    running: 'badge-scheduled',
    completed: 'badge-active',
    failed: 'badge-failed',
    cancelled: 'badge-paused',
}[s] || 'badge-draft');

export default function PipelineIndex({ jobs }) {
    const [showCreate, setShowCreate] = useState(false);
    const form = useForm({ title: '', script: '' });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('pipeline.store'), { onSuccess: () => { form.reset(); setShowCreate(false); } });
    };

    const running = jobs.data.filter((j) => j.status === 'running');
    const queued = jobs.data.filter((j) => j.status === 'queued');
    const completed = jobs.data.filter((j) => j.status === 'completed').slice(0, 5);

    return (
        <AuthenticatedLayout title="AI Pipeline" subtitle="Script → Voiceover → Thumbnail → Video → WhatsApp Upload">
            <Head title="AI Pipeline" />

            <div className="flex justify-end">
                <button onClick={() => setShowCreate(true)} className="btn-brand">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    New Pipeline Job
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 card p-5">
                    <h3 className="font-semibold text-gray-800 mb-3">All Jobs</h3>
                    {jobs.data.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No pipelines yet — research a topic and start one.</div>}
                    <div className="space-y-2">
                        {jobs.data.map((j) => (
                            <Link href={route('pipeline.show', j.id)} key={j.id}
                                  className="block p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition group">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate" dir={/[؀-ۿ]/.test(j.title) ? 'rtl' : 'ltr'}>{j.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Stage: {j.current_stage} · {j.research_topic?.topic ? `from "${j.research_topic.topic.slice(0, 30)}"` : 'Manual'}</p>
                                    </div>
                                    <div className="w-32 h-1.5 bg-gray-100 rounded-full">
                                        <div className="h-1.5 rounded-full" style={{ width: `${j.progress}%`, background: 'linear-gradient(90deg,#128C7E,#25D366)' }}/>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusBadge(j.status)}`}>{j.status}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="card p-5">
                        <h3 className="font-semibold text-gray-800 mb-3">Pipeline Queue</h3>
                        <div className="space-y-2">
                            {running.length === 0 && queued.length === 0 && completed.length === 0 && (
                                <p className="text-xs text-gray-400">Queue is empty.</p>
                            )}
                            {running.map((j) => (
                                <div key={j.id} className="flex items-center gap-2 p-2 bg-brand-light rounded-lg">
                                    <div className="w-2 h-2 bg-brand rounded-full animate-pulse flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 truncate">{j.title}</p>
                                        <p className="text-xs text-gray-500">Rendering · {j.progress}%</p>
                                    </div>
                                </div>
                            ))}
                            {queued.map((j) => (
                                <div key={j.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{j.title}</p>
                                        <p className="text-xs text-gray-400">Queued</p>
                                    </div>
                                </div>
                            ))}
                            {completed.map((j) => (
                                <div key={j.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                    <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 truncate">{j.title}</p>
                                        <p className="text-xs text-green-600">Uploaded to WA ✓</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-5">
                        <h3 className="font-semibold text-gray-800 mb-3">Render Defaults</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Resolution</span><span className="font-medium text-gray-700">1080×1920</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Format</span><span className="font-medium text-gray-700">MP4 / H.264</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Voice</span><span className="font-medium text-gray-700">Urdu (Natural)</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Auto-publish</span><span className="font-medium text-green-600">7:00 PM PKT</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
                        <h3 className="font-bold text-gray-800 text-lg">New Pipeline Job</h3>
                        <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)}
                               placeholder="Title (e.g. عمران خان رہائی)"
                               className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand" required/>
                        <textarea rows={6} value={form.data.script} onChange={(e) => form.setData('script', e.target.value)}
                                  placeholder="Optional: paste a script. Otherwise it will be generated."
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand resize-none"/>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="btn-outline text-sm">Cancel</button>
                            <button disabled={form.processing} className="btn-brand text-sm">Start Pipeline</button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
