import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

const STEPS = [
    { w: 20, label: 'Gathering web data…' },
    { w: 40, label: 'Analysing sources…' },
    { w: 60, label: 'Generating script…' },
    { w: 80, label: 'Preparing voiceover prompt…' },
    { w: 100, label: 'Done ✓' },
];

const stepFor = (status) => {
    if (status === 'pending') return 0;
    if (status === 'researching') return 1;
    if (status === 'completed') return 4;
    return 0;
};

export default function ResearchShow({ topic }) {
    useEffect(() => {
        if (topic.status === 'pending' || topic.status === 'researching') {
            const t = setInterval(() => router.reload({ only: ['topic'] }), 4000);
            return () => clearInterval(t);
        }
    }, [topic.status]);

    const startPipeline = () => {
        router.post(route('pipeline.store'), { title: topic.topic, research_topic_id: topic.id, script: topic.script });
    };

    const isUrdu = (topic.audience_language || topic.language) === 'ur';
    const stepIdx = stepFor(topic.status);
    const step = STEPS[stepIdx] || STEPS[0];

    return (
        <AuthenticatedLayout
            title={topic.topic}
            subtitle={`${topic.content_type} · ${topic.depth || 'standard'} · ${topic.audience_language || topic.language}`}>
            <Head title={topic.topic} />

            <Link href="/research" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Back to research
            </Link>

            {/* Progress card (only while running) */}
            {(topic.status === 'pending' || topic.status === 'researching') && (
                <div className="card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-semibold text-gray-800">AI Research in Progress…</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{step.label}</span>
                            <span>Step {stepIdx + 1} / {STEPS.length}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-2 rounded-full transition-all duration-500"
                                 style={{ width: `${step.w}%`, background: 'linear-gradient(90deg,#128C7E,#25D366)' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generated script */}
            <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Generated Script</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        topic.status === 'completed' ? 'badge-active' :
                        topic.status === 'researching' ? 'badge-scheduled' :
                        topic.status === 'failed' ? 'badge-failed' : 'badge-draft'}`}>
                        {topic.status}
                    </span>
                </div>
                <div className={`bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed min-h-[120px] border border-dashed border-gray-200 ${isUrdu ? 'text-right' : ''}`}
                     dir={isUrdu ? 'rtl' : 'ltr'}>
                    {topic.script ? (
                        <p className="whitespace-pre-wrap">{topic.script}</p>
                    ) : (
                        <p className="text-gray-400 italic text-center">AI-generated script will appear here after research is complete…</p>
                    )}
                </div>
            </div>

            {/* Summary + outline + sources */}
            {(topic.research_summary || topic.outline?.length || topic.sources?.length) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {topic.research_summary && (
                        <div className="card p-5 lg:col-span-2">
                            <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
                            <p className={`text-sm text-gray-700 whitespace-pre-wrap ${isUrdu ? 'text-right' : ''}`} dir={isUrdu ? 'rtl' : 'ltr'}>
                                {topic.research_summary}
                            </p>
                            {topic.outline?.length > 0 && (
                                <>
                                    <h4 className="font-semibold text-gray-800 mt-4 mb-2">Outline</h4>
                                    <ul className={`list-disc text-sm text-gray-700 space-y-1 ${isUrdu ? 'pr-5 text-right' : 'pl-5'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
                                        {topic.outline.map((b, i) => <li key={i}>{b}</li>)}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                    {topic.sources?.length > 0 && (
                        <div className="card p-5">
                            <h3 className="font-semibold text-gray-800 mb-2">Sources</h3>
                            <ul className="text-xs text-gray-500 space-y-1">
                                {topic.sources.map((s, i) => <li key={i}>• {s}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Voiceover + Thumbnail + Publish CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                        </svg>
                        Voiceover
                    </h3>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 mb-2">
                        <option>Male – Natural Urdu</option>
                        <option>Female – Natural Urdu</option>
                        <option>Male – English</option>
                    </select>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                        <button className="w-8 h-8 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                            <div className="h-1.5 bg-brand rounded-full" style={{ width: topic.script ? '15%' : '0%' }}></div>
                        </div>
                        <span className="text-xs text-gray-400">{topic.script ? '0:15' : '0:00'}</span>
                    </div>
                </div>

                <div className="card p-5">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        Thumbnail
                    </h3>
                    <div className="h-24 rounded-xl flex items-center justify-center text-white text-xs font-semibold mt-2"
                         style={{ background: 'linear-gradient(135deg,#128C7E,#25D366)' }}>
                        {topic.thumbnail_path ? (
                            <img src={`/storage/thumbnails/${topic.thumbnail_path.split('/').pop()}`} alt="thumbnail" className="w-full h-full object-cover rounded-xl"/>
                        ) : (
                            'AI Generated Preview'
                        )}
                    </div>
                </div>
            </div>

            <div className="card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                    <p className="font-semibold text-gray-800">Ready to publish?</p>
                    <p className="text-gray-400 text-sm">Send directly to a campaign or schedule for 7:00 PM PKT</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/campaigns" className="btn-outline text-sm">Add to Campaign</Link>
                    {topic.status === 'completed' && (
                        <button onClick={startPipeline} className="btn-brand text-sm">Go to Pipeline →</button>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
