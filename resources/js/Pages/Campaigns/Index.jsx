import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const statusBadge = {
    draft: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-50 text-blue-600',
    active: 'bg-green-50 text-green-700',
    paused: 'bg-amber-50 text-amber-700',
    completed: 'bg-purple-50 text-purple-700',
    failed: 'bg-red-50 text-red-700',
};

export default function CampaignsIndex({ campaigns, segments, templates, filters }) {
    const [showCreate, setShowCreate] = useState(false);
    const form = useForm({
        name: '', type: 'promotional', segment_id: '', template_id: '',
        message_body: '', media_url: '', media_type: '', scheduled_at: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('campaigns.store'), {
            onSuccess: () => { form.reset(); setShowCreate(false); },
        });
    };

    const action = (campaign, op) => router.post(route(`campaigns.${op}`, campaign.id));
    const remove = (campaign) => {
        if (confirm(`Delete campaign "${campaign.name}"?`)) {
            router.delete(route('campaigns.destroy', campaign.id));
        }
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Campaigns</h2>
                    <p className="text-gray-400 text-sm">Manage and dispatch WhatsApp campaigns.</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                    + New Campaign
                </button>
            </div>
        }>
            <Head title="Campaigns" />

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                            <tr>
                                <th className="text-left px-5 py-3.5 font-medium">Name</th>
                                <th className="text-left px-3 py-3.5 font-medium">Type</th>
                                <th className="text-left px-3 py-3.5 font-medium">Segment</th>
                                <th className="text-left px-3 py-3.5 font-medium">Status</th>
                                <th className="text-left px-3 py-3.5 font-medium">Progress</th>
                                <th className="text-left px-3 py-3.5 font-medium">Sent</th>
                                <th className="text-left px-3 py-3.5 font-medium">Scheduled</th>
                                <th className="text-right px-5 py-3.5 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {campaigns.data.length === 0 && (
                                <tr><td colSpan="8" className="text-center py-10 text-gray-400">No campaigns yet.</td></tr>
                            )}
                            {campaigns.data.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 group">
                                    <td className="px-5 py-4 font-semibold text-gray-800">{c.name}</td>
                                    <td className="px-3 py-4 capitalize text-gray-600">{c.type}</td>
                                    <td className="px-3 py-4 text-gray-600">{c.segment?.name || '—'}</td>
                                    <td className="px-3 py-4">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge[c.status] || 'bg-gray-100'}`}>{c.status}</span>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="w-32 h-1.5 bg-gray-100 rounded-full">
                                            <div className="h-1.5 bg-emerald-500 rounded-full"
                                                 style={{ width: `${c.total_recipients ? Math.min(100, (c.sent_count / c.total_recipients) * 100) : 0}%` }} />
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 text-gray-700">{c.sent_count}/{c.total_recipients}</td>
                                    <td className="px-3 py-4 text-xs text-gray-500">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—'}</td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="inline-flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            {c.status === 'draft' && (
                                                <button onClick={() => action(c, 'start')} className="px-2 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Start</button>
                                            )}
                                            {c.status === 'active' && (
                                                <button onClick={() => action(c, 'pause')} className="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">Pause</button>
                                            )}
                                            {c.status === 'paused' && (
                                                <button onClick={() => action(c, 'resume')} className="px-2 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Resume</button>
                                            )}
                                            <button onClick={() => remove(c)} className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {campaigns.links && (
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div>{campaigns.from || 0}–{campaigns.to || 0} of {campaigns.total}</div>
                        <div className="flex gap-1">
                            {campaigns.links.map((l, i) => (
                                <Link key={i} href={l.url || ''} preserveScroll
                                      className={`px-2 py-1 rounded-lg ${l.active ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100'} ${!l.url ? 'opacity-30 pointer-events-none' : ''}`}
                                      dangerouslySetInnerHTML={{ __html: l.label }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">New Campaign</h3>
                            <button type="button" onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)}
                                       className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" required />
                                {form.errors.name && <div className="text-xs text-red-600 mt-1">{form.errors.name}</div>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type</label>
                                    <select value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="promotional">Promotional</option>
                                        <option value="transactional">Transactional</option>
                                        <option value="broadcast">Broadcast</option>
                                        <option value="drip">Drip</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Segment</label>
                                    <select value={form.data.segment_id} onChange={(e) => form.setData('segment_id', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="">All active contacts</option>
                                        {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Template (optional)</label>
                                <select value={form.data.template_id} onChange={(e) => form.setData('template_id', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="">None — use message body</option>
                                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Message body</label>
                                <textarea rows={4} value={form.data.message_body} onChange={(e) => form.setData('message_body', e.target.value)}
                                          placeholder="e.g. Hi {{first_name}}, our summer sale is on!"
                                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Media URL</label>
                                    <input value={form.data.media_url} onChange={(e) => form.setData('media_url', e.target.value)}
                                           className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"
                                           placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Media type</label>
                                    <select value={form.data.media_type} onChange={(e) => form.setData('media_type', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="">—</option>
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                        <option value="document">Document</option>
                                        <option value="audio">Audio</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Schedule for (optional)</label>
                                <input type="datetime-local" value={form.data.scheduled_at}
                                       onChange={(e) => form.setData('scheduled_at', e.target.value)}
                                       className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm">Cancel</button>
                            <button disabled={form.processing}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
                                {form.processing ? 'Creating…' : 'Create Campaign'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
