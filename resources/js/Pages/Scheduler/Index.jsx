import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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

export default function SchedulerIndex({ posts, month, campaigns, pipeline_jobs, settings }) {
    const [showCreate, setShowCreate] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const cells = useMemo(() => buildMonth(month), [month]);

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
        setSelectedDate(iso);
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

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Scheduler</h2>
                    <p className="text-gray-400 text-sm">Auto-publish at {String(settings.publish_hour).padStart(2, '0')}:{String(settings.publish_minute).padStart(2, '0')} {settings.timezone}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">←</button>
                    <div className="text-sm font-semibold text-gray-700">
                        {new Date(month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={() => navigate(1)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">→</button>
                </div>
            </div>
        }>
            <Head title="Scheduler" />

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-7 text-xs text-gray-500 font-medium uppercase border-b border-gray-100">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                        <div key={d} className="px-3 py-2 text-center">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {cells.map((d, i) => {
                        const iso = d ? d.toISOString().slice(0, 10) : null;
                        const today = iso === new Date().toISOString().slice(0, 10);
                        const items = (iso && byDate[iso]) || [];
                        return (
                            <div key={i} onClick={() => openDate(d)}
                                 className={`min-h-28 border-t border-l border-gray-100 p-2 text-xs cursor-pointer transition ${d ? 'hover:bg-gray-50' : 'bg-gray-50/40'} ${today ? 'bg-emerald-50/40' : ''}`}>
                                {d && (
                                    <>
                                        <div className={`text-right ${today ? 'text-emerald-700 font-bold' : 'text-gray-500'}`}>{d.getDate()}</div>
                                        <div className="space-y-1 mt-1">
                                            {items.slice(0, 3).map((p) => (
                                                <div key={p.id} className={`px-1.5 py-1 rounded-md truncate text-[11px] ${
                                                    p.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                                    p.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                    p.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                                                    'bg-blue-100 text-blue-700'}`}
                                                     onClick={(e) => { e.stopPropagation(); }}>
                                                    {p.scheduled_time?.slice(0, 5)} {p.title}
                                                </div>
                                            ))}
                                            {items.length > 3 && <div className="text-[10px] text-gray-400">+{items.length - 3} more</div>}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">All scheduled</h3></div>
                <div className="divide-y divide-gray-50">
                    {posts.length === 0 && <div className="px-5 py-6 text-sm text-gray-400 text-center">Nothing scheduled in this month.</div>}
                    {posts.map((p) => (
                        <div key={p.id} className="px-5 py-3 flex items-center gap-3 text-sm group hover:bg-gray-50/50">
                            <div className="text-xs text-gray-500 w-24">{p.scheduled_for} {p.scheduled_time?.slice(0, 5)}</div>
                            <div className="flex-1 min-w-0 truncate font-medium text-gray-800">{p.title}</div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                p.status === 'published' ? 'bg-emerald-50 text-emerald-700' :
                                p.status === 'failed' ? 'bg-red-50 text-red-700' :
                                'bg-blue-50 text-blue-700'}`}>{p.status}</span>
                            <button onClick={() => remove(p)} className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 transition">Delete</button>
                        </div>
                    ))}
                </div>
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
                        <h3 className="font-bold text-lg">Schedule a Post</h3>
                        <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)}
                               placeholder="Title" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" required/>
                        <textarea rows={3} value={form.data.caption} onChange={(e) => form.setData('caption', e.target.value)}
                                  placeholder="Caption / message" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 resize-none"/>
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
                                {campaigns.map((c) => <option key={c.id} value={c.id}>Campaign: {c.name}</option>)}
                            </select>
                            <select value={form.data.pipeline_job_id} onChange={(e) => form.setData('pipeline_job_id', e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                <option value="">No pipeline asset</option>
                                {pipeline_jobs.map((p) => <option key={p.id} value={p.id}>Pipeline: {p.title}</option>)}
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={form.data.auto_publish} onChange={(e) => form.setData('auto_publish', e.target.checked)}/>
                            Auto-publish at scheduled time
                        </label>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">Cancel</button>
                            <button disabled={form.processing} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Schedule</button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
