import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function ResearchShow({ topic }) {
    const [data, setData] = useState(topic);

    useEffect(() => {
        if (data.status === 'pending' || data.status === 'researching') {
            const t = setInterval(() => router.reload({ only: ['topic'], onSuccess: (page) => setData(page.props.topic) }), 4000);
            return () => clearInterval(t);
        }
    }, [data.status]);

    const startPipeline = () => {
        router.post(route('pipeline.store'), { title: data.topic, research_topic_id: data.id, script: data.script });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/research" className="text-xs text-gray-400 hover:text-gray-600">← Back to research</Link>
                    <h2 className="text-xl font-bold text-gray-800">{data.topic}</h2>
                </div>
                {data.status === 'completed' && (
                    <button onClick={startPipeline} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">
                        Send to Pipeline →
                    </button>
                )}
            </div>
        }>
            <Head title={data.topic} />

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        data.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        data.status === 'researching' ? 'bg-blue-50 text-blue-700' :
                        data.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{data.status}</span>
                    <span className="text-xs text-gray-400">{data.content_type} · {data.tone} · {data.language}</span>
                </div>

                {(data.status === 'pending' || data.status === 'researching') && (
                    <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"/>
                            Research is running. This page auto-refreshes every few seconds.
                        </div>
                    </div>
                )}

                {data.research_summary && (
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.research_summary}</p>
                    </section>
                )}

                {data.outline?.length > 0 && (
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-2">Outline</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                            {data.outline.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                    </section>
                )}

                {data.script && (
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-2">Script</h3>
                        <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">{data.script}</div>
                    </section>
                )}

                {data.sources?.length > 0 && (
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-2">Sources</h3>
                        <ul className="text-xs text-gray-500 space-y-0.5">
                            {data.sources.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                    </section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
