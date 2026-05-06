import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function buildMonth(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m - 1, d));
    while (cells.length % 7) cells.push(null);
    return cells;
}

const statusBg = {
    published: 'bg-green-100 text-green-700',
    publishing: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    scheduled: 'bg-emerald-100 text-emerald-700',
};

export default function SchedulerIndex({ posts, month, campaigns, pipeline_jobs, settings }) {
    const [showCreate, setShowCreate] = useState(false);
    const [clock, setClock] = useState('--:--:--');
    const cells = useMemo(() => buildMonth(month), [month]);

    useEffect(() => {
        const tz = settings?.timezone || 'Asia/Karachi';
        const upd = () => {
            try {
                setClock(new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: tz }));
            } catch { setClock(new Date().toLocaleTimeString()); }
        };
        upd();
        const t = setInterval(upd, 1000);
        return () => clearInterval(t);
    }, [settings?.timezone]);

    const byDate = useMemo(() => {
        const map = {};
        posts.forEach((p) => { (map[p.scheduled_for] = map[p.scheduled_for] || []).push(p); });
        return map;
    }, [posts]);

    const form = useForm({
        title: '', caption: '', scheduled_for: '', scheduled_time: '19:00',
        campaign_id: '', pipeline_job_id: '', auto_publish: true,
    });

    const openDate = (d) => {
        if (!d) return;
        const iso = d.toISOString().slice(0, 10);
        form.setData('scheduled_for', iso);
        form.setData('scheduled_time', `${String(settings.publish_hour).padStart(2, '0')}:${String(settings.publish_minute).padStart(2, '0')}`);
        setShowCreate(true);
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('scheduler.store'), { onSuccess: () => { form.reset(); setShowCreate(false); } });
    };

    const remove = (p) => confirm('Delete schedule?') && router.delete(route('scheduler.destroy', p.id));

    const navigate = (delta) => {
        const [y, m] = month.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        router.get('/scheduler', { month: d.toISOString().slice(0, 10) }, { preserveState: true });
    };

    const monthLabel = new Date(month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const nextPost = posts.find((p) => p.status === 'scheduled');

    return (
        <AuthenticatedLayout title="Scheduler" subtitle={`All posts scheduled at ${String(settings.publish_hour).padStart(2,'0')}:${String(settings.publish_minute).padStart(2,'0')} · ${settings.timezone} · شیڈیولر`}>
            <Head title="Scheduler" />

            <div className="flex justify-end">
                <button onClick={() => setShowCreate(true)} className="btn-brand text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    Schedule Post
                </button>
            </div>

            {/* Clock banner */}
            <div className="card p-4 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800 font-mono">{clock}</p>
                        <p className="text-xs text-gray-400">{settings.timezone}</p>
                    </div>
                </div>
                <div className="h-10 w-px bg-gray-100 hidden sm:block"></div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">Next Post</p>
                    <p className="text-xs text-gray-400">{nextPost ? `${nextPost.scheduled_for} ${nextPost.scheduled_time?.slice(0,5)} — ${nextPost.title}` : 'Nothing scheduled'}</p>
                </div>
                <div className="h-10 w-px bg-gray-100 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-sm text-green-700 font-medium">Auto-publish Active</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="btn-outline text-xs px-3 py-1.5">←</button>
                    <span className="text-sm font-semibold text-gray-700 px-2">{monthLabel}</span>
                    <button onClick={() => navigate(1)} className="btn-outline text-xs px-3 py-1.5">→</button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="xl:col-span-2 card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">{monthLabel}</h3>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((d, i) => {
                            const iso = d ? d.toISOString().slice(0, 10) : null;
                            const today = iso === new Date().toISOString().slice(0, 10);
                            const items = (iso && byDate[iso]) || [];
                            return (
                                <div key={i} onClick={() => openDate(d)}
                                     className={`p-1.5 min-h-[72px] rounded-lg ${d ? 'border border-transparent hover:border-brand-light cursor-pointer' : 'bg-gray-50/40'} ${today ? 'bg-brand-light/40 ring-1 ring-brand-light' : ''} group`}>
                                    {d && (
                                        <>
                                            <span className={`text-xs font-semibold ${today ? 'text-brand-dark' : 'text-gray-700 group-hover:text-brand-dark'}`}>{d.getDate()}</span>
                                            <div className="space-y-1 mt-1">
                                                {items.slice(0, 2).map((p) => (
                                                    <div key={p.id} title={p.title}
                                                         className={`text-[11px] rounded px-1 py-0.5 truncate ${statusBg[p.status] || statusBg.scheduled}`}
                                                         dir={/[؀-ۿ]/.test(p.title) ? 'rtl' : 'ltr'}>
                                                        {p.scheduled_time?.slice(0, 5)} {p.title}
                                                    </div>
                                                ))}
                                                {items.length > 2 && <div className="text-[10px] text-gray-400">+{items.length - 2} more</div>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming list */}
                <div className="card p-5">
                    <h3 className="font-semibold text-gray-800 mb-3">Upcoming Posts</h3>
                    {posts.length === 0 ? (
                        <p className="text-sm text-gray-400">Nothing scheduled in this month.</p>
                    ) : (
                        <div className="space-y-2">
                            {posts.map((p) => (
                                <div key={p.id} className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 group">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate" dir={/[؀-ۿ]/.test(p.title) ? 'rtl' : 'ltr'}>{p.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{p.scheduled_for} · {p.scheduled_time?.slice(0,5)} {settings.timezone.split('/')[1]}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg[p.status] || statusBg.scheduled}`}>{p.status}</span>
                                        <button onClick={() => remove(p)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400 transition">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
                        <h3 className="font-bold text-gray-800 text-lg">Schedule a Post</h3>
                        <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)}
                               placeholder="Title (e.g. کراچی موسم الرٹ)"
                               className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand" required/>
                        <textarea rows={3} value={form.data.caption} onChange={(e) => form.setData('caption', e.target.value)}
                                  placeholder="Caption / message"
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 resize-none"/>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="date" value={form.data.scheduled_for} onChange={(e) => form.setData('scheduled_for', e.target.value)}
                                   className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" required/>
                            <input type="time" value={form.data.scheduled_time} onChange={(e) => form.setData('scheduled_time', e.target.value)}
                                   className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select value={form.data.campaign_id} onChange={(e) => form.setData('campaign_id', e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                <option value="">No campaign</option>
                                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={form.data.pipeline_job_id} onChange={(e) => form.setData('pipeline_job_id', e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                <option value="">No pipeline asset</option>
                                {pipeline_jobs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={form.data.auto_publish} onChange={(e) => form.setData('auto_publish', e.target.checked)} className="rounded accent-brand"/>
                            Auto-publish at scheduled time
                        </label>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="btn-outline text-sm">Cancel</button>
                            <button disabled={form.processing} className="btn-brand text-sm">Schedule</button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
