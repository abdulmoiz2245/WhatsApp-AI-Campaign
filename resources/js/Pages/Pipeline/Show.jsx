import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

const STEPS = [
    { key: 'research', label: 'Research' },
    { key: 'script', label: 'Script' },
    { key: 'voiceover', label: 'Voiceover' },
    { key: 'video', label: 'Video' },
    { key: 'thumbnail', label: 'Thumbnail' },
    { key: 'upload', label: 'WA Upload' },
];

const stageStatusOf = (job, key) => {
    if (key === 'research') return job.research_topic_id ? 'completed' : 'completed';
    const s = job.stages?.[key]?.status;
    if (s) return s;
    const idx = STEPS.findIndex((x) => x.key === key);
    const curIdx = STEPS.findIndex((x) => x.key === job.current_stage);
    if (curIdx === -1) return 'pending';
    if (idx < curIdx) return 'completed';
    if (idx === curIdx) return job.status === 'failed' ? 'failed' : 'running';
    return 'pending';
};

const StepCircle = ({ idx, status }) => {
    if (status === 'completed') {
        return <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#128C7E' }}>✓</div>;
    }
    if (status === 'running') {
        return <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-brand bg-brand-light text-brand-dark text-sm font-bold animate-pulse">{idx + 1}</div>;
    }
    if (status === 'failed') {
        return <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 border-2 border-red-300 text-red-600 text-sm font-bold">!</div>;
    }
    return <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 text-sm font-bold">{idx + 1}</div>;
};

export default function PipelineShow({ job }) {
    useEffect(() => {
        if (job.status === 'queued' || job.status === 'running') {
            const t = setInterval(() => router.reload({ only: ['job'] }), 3500);
            return () => clearInterval(t);
        }
    }, [job.status]);

    const fileBase = (path) => (path ? path.split('/').pop() : null);

    return (
        <AuthenticatedLayout title="AI Video Pipeline" subtitle="Research → Script → Voiceover → Video → Thumbnail → WhatsApp Upload">
            <Head title={job.title} />

            <Link href="/pipeline" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Back to pipeline
            </Link>

            {/* Stepper */}
            <div className="card p-6">
                <div className="flex items-center gap-0">
                    {STEPS.map((s, i) => {
                        const status = stageStatusOf(job, s.key);
                        const nextStatus = i < STEPS.length - 1 ? stageStatusOf(job, STEPS[i + 1].key) : null;
                        const connectorDone = status === 'completed';
                        return (
                            <div key={s.key} className="flex items-center flex-1 last:flex-none min-w-0">
                                <div className="flex flex-col items-center min-w-[90px]">
                                    <StepCircle idx={i} status={status}/>
                                    <p className={`text-xs mt-2 text-center ${status === 'running' ? 'font-bold text-brand-dark' : status === 'completed' ? 'font-semibold text-brand-dark' : 'text-gray-500'}`}>
                                        {s.label}
                                    </p>
                                    <p className={`text-xs text-center ${status === 'running' ? 'text-brand' : 'text-gray-400'}`}>
                                        {status === 'completed' ? 'Done' : status === 'running' ? 'In Progress' : status === 'failed' ? 'Failed' : 'Pending'}
                                    </p>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`step-connector mb-5 ${connectorDone ? 'done' : ''}`}/>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Active job view */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Video Rendering</h3>
                            <p className="text-gray-400 text-xs">{job.title}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            job.status === 'completed' ? 'badge-active' :
                            job.status === 'running' ? 'badge-scheduled' :
                            job.status === 'failed' ? 'badge-failed' : 'badge-draft'}`}>
                            {job.status === 'running' ? 'Rendering…' : job.status}
                        </span>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Pipeline progress</span>
                            <span>{job.progress}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-2.5 rounded-full ${job.status === 'running' ? 'animate-pulse' : ''}`}
                                 style={{ width: `${job.progress}%`, background: 'linear-gradient(90deg,#128C7E,#25D366)' }}></div>
                        </div>
                        {job.status === 'running' && (
                            <p className="text-xs text-gray-400 mt-1.5">Stage: {job.current_stage}</p>
                        )}
                    </div>

                    {/* Video preview */}
                    {job.video_path ? (
                        <video controls className="w-full rounded-xl aspect-video bg-black">
                            <source src={`/storage/videos/${fileBase(job.video_path)}`} type="video/mp4"/>
                        </video>
                    ) : (
                        <div className="aspect-video rounded-xl flex items-center justify-center relative overflow-hidden"
                             style={{ background: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' }}>
                            <div className="relative text-center">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                                <p className="text-white text-sm font-semibold">Video Preview</p>
                                <p className="text-white/60 text-xs mt-0.5">Available after render</p>
                            </div>
                            <div className="absolute inset-x-0 h-0.5" style={{ top: `${job.progress}%`, background: '#25D36666', transition: 'top 0.5s' }}/>
                        </div>
                    )}

                    <div className="flex gap-3 mt-4">
                        <button onClick={() => router.delete(route('pipeline.destroy', job.id))} className="btn-outline text-xs flex-1 justify-center">Cancel / Delete</button>
                        {job.video_path && (
                            <a href={`/storage/videos/${fileBase(job.video_path)}`} download className="btn-brand text-xs flex-1 justify-center">Download Video</a>
                        )}
                    </div>
                </div>

                {/* Render settings */}
                <div className="space-y-4">
                    <div className="card p-5">
                        <h3 className="font-semibold text-gray-800 mb-3">Render Settings</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Resolution</span><span className="font-medium text-gray-700">1080 × 1920 (9:16)</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Format</span><span className="font-medium text-gray-700">MP4 / H.264</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-medium text-gray-700">{job.voiceover_duration_ms ? `${Math.round(job.voiceover_duration_ms / 1000)}s` : '~45 sec'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Voice</span><span className="font-medium text-gray-700">Natural Urdu</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Subtitles</span><span className="font-medium text-green-600">Enabled</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Watermark</span><span className="font-medium text-gray-700">Logo (top-left)</span></div>
                        </div>
                    </div>

                    {(job.voiceover_path || job.thumbnail_path) && (
                        <div className="card p-5 space-y-3">
                            <h3 className="font-semibold text-gray-800">Assets</h3>
                            {job.thumbnail_path && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Thumbnail</p>
                                    <img src={`/storage/thumbnails/${fileBase(job.thumbnail_path)}`} alt="" className="w-full rounded-lg"/>
                                </div>
                            )}
                            {job.voiceover_path && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Voiceover</p>
                                    <audio controls className="w-full">
                                        <source src={`/storage/voiceovers/${fileBase(job.voiceover_path)}`} type="audio/mpeg"/>
                                    </audio>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {job.script && (
                <div className="card p-5">
                    <h3 className="font-semibold text-gray-800 mb-2">Script</h3>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">{job.script}</div>
                </div>
            )}

            {/* WA upload card */}
            <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-brand-dark" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp Auto-Upload
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                        Scheduled at <strong className="text-gray-700">7:00 PM PKT (Asia/Karachi)</strong> · Daily auto-publish enabled
                        {job.whatsapp_media_id && <span className="ml-2 text-green-600 font-medium">· Uploaded ✓</span>}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/scheduler" className="btn-outline text-sm">View Scheduler</Link>
                    <Link href="/campaigns" className="btn-brand text-sm" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>Use in Campaign →</Link>
                </div>
            </div>

            {job.error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
                    <div className="font-semibold mb-1">Error in stage: {job.error.stage}</div>
                    <div>{job.error.message}</div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
