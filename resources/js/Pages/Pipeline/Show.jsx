import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

const STAGES = [
    { key: 'script', label: 'Script' },
    { key: 'voiceover', label: 'Voiceover' },
    { key: 'thumbnail', label: 'Thumbnail' },
    { key: 'video', label: 'Video' },
    { key: 'upload', label: 'WA Upload' },
];

export default function PipelineShow({ job }) {
    useEffect(() => {
        if (job.status === 'queued' || job.status === 'running') {
            const t = setInterval(() => router.reload({ only: ['job'] }), 3500);
            return () => clearInterval(t);
        }
    }, [job.status]);

    const stageStatus = (key) => job.stages?.[key]?.status || (job.current_stage === key ? 'running' : 'pending');

    return (
        <AuthenticatedLayout header={
            <div>
                <Link href="/pipeline" className="text-xs text-gray-400 hover:text-gray-600">← Back to pipeline</Link>
                <h2 className="text-xl font-bold text-gray-800">{job.title}</h2>
            </div>
        }>
            <Head title={job.title} />

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        job.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        job.status === 'running' ? 'bg-blue-50 text-blue-700' :
                        job.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{job.status}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: `${job.progress}%` }}/>
                    </div>
                    <span className="text-xs text-gray-500">{job.progress}%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {STAGES.map((s, i) => {
                        const st = stageStatus(s.key);
                        return (
                            <div key={s.key} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <div className="text-xs text-gray-400">Step {i + 1}</div>
                                <div className="font-semibold text-gray-800 mt-0.5">{s.label}</div>
                                <div className={`mt-2 text-xs inline-block px-2 py-0.5 rounded-full ${
                                    st === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                    st === 'running' ? 'bg-blue-50 text-blue-700' :
                                    st === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{st}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {job.script && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 mb-2">Script</h3>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">{job.script}</div>
                </div>
            )}

            {(job.voiceover_path || job.video_path || job.thumbnail_path) && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {job.thumbnail_path && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Thumbnail</h4>
                            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                                <img src={`/storage/thumbnails/${job.thumbnail_path.split('/').pop()}`} alt="thumb" className="w-full h-full object-cover"/>
                            </div>
                        </div>
                    )}
                    {job.voiceover_path && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Voiceover</h4>
                            <audio controls className="w-full">
                                <source src={`/storage/voiceovers/${job.voiceover_path.split('/').pop()}`} type="audio/mpeg"/>
                            </audio>
                        </div>
                    )}
                    {job.video_path && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Video</h4>
                            <video controls className="w-full rounded-xl">
                                <source src={`/storage/videos/${job.video_path.split('/').pop()}`} type="video/mp4"/>
                            </video>
                        </div>
                    )}
                </div>
            )}

            {job.error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
                    <div className="font-semibold mb-1">Error in stage: {job.error.stage}</div>
                    <div>{job.error.message}</div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
