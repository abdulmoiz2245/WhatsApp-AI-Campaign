import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const stageColors = {
    queued: 'bg-gray-100 text-gray-600',
    running: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-red-50 text-red-700',
    cancelled: 'bg-amber-50 text-amber-700',
};

export default function PipelineIndex({ jobs }) {
    const [showCreate, setShowCreate] = useState(false);
    const form = useForm({ title: '', script: '' });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('pipeline.store'), { onSuccess: () => { form.reset(); setShowCreate(false); } });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">AI Pipeline</h2>
                    <p className="text-gray-400 text-sm">Script → Voiceover → Thumbnail → Video → WA Upload</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">+ New Pipeline</button>
            </div>
        }>
            <Head title="AI Pipeline" />

            <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Jobs</h3></div>
                <div className="divide-y divide-gray-50">
                    {jobs.data.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No pipelines yet.</div>}
                    {jobs.data.map((j) => (
                        <Link href={route('pipeline.show', j.id)} key={j.id} className="block px-5 py-4 hover:bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-800 truncate">{j.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">Stage: {j.current_stage} · {j.research_topic?.topic || 'Manual'}</div>
                                </div>
                                <div className="w-32 h-1.5 bg-gray-100 rounded-full">
                                    <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${j.progress}%` }}/>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${stageColors[j.status] || 'bg-gray-100'}`}>{j.status}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
                        <h3 className="font-bold text-lg">New Pipeline Job</h3>
                        <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)}
                               placeholder="Title" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" required/>
                        <textarea rows={6} value={form.data.script} onChange={(e) => form.setData('script', e.target.value)}
                                  placeholder="Optional: paste a script. Otherwise it will be generated."
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 resize-none"/>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">Cancel</button>
                            <button disabled={form.processing} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Start Pipeline</button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
