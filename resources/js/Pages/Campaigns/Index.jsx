import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const badgeClass = (s) => ({
    active: 'badge-active', scheduled: 'badge-scheduled', paused: 'badge-paused',
    draft: 'badge-draft', failed: 'badge-failed', completed: 'badge-completed',
}[s] || 'badge-draft');

const typePillClass = (t) => ({
    promotional: 'bg-purple-50 text-purple-600',
    transactional: 'bg-emerald-50 text-emerald-700',
    broadcast: 'bg-blue-50 text-blue-600',
    drip: 'bg-amber-50 text-amber-700',
}[t] || 'bg-gray-100 text-gray-600');

const Icon = ({ d, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d}/>
    </svg>
);

export default function CampaignsIndex({ campaigns, segments, templates, filters }) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState(null);
    const [selected, setSelected] = useState(new Set());

    const toggle = (id) => setSelected((s) => {
        const next = new Set(s);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const toggleAll = () => {
        const ids = campaigns.data.map((c) => c.id);
        setSelected((s) => s.size === ids.length ? new Set() : new Set(ids));
    };
    const bulk = (action) => {
        if (selected.size === 0) return;
        if (action === 'delete' && !confirm(`Delete ${selected.size} campaign(s)? This cannot be undone.`)) return;
        router.post(route('campaigns.bulk'), { action, ids: Array.from(selected) }, {
            preserveScroll: true,
            onSuccess: () => setSelected(new Set()),
        });
    };
    const form = useForm({
        name: '', type: 'promotional', segment_id: '', template_id: '',
        message_body: '', media_url: '', media_type: '', scheduled_at: '',
    });
    const editForm = useForm({
        name: '', type: 'promotional', status: 'draft', segment_id: '', template_id: '',
        message_body: '', media_url: '', media_type: '', scheduled_at: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('campaigns.store'), {
            onSuccess: () => { form.reset(); setShowCreate(false); },
        });
    };

    const openEdit = (c) => {
        editForm.setData({
            name: c.name || '',
            type: c.type || 'promotional',
            status: c.status || 'draft',
            segment_id: c.segment_id || '',
            template_id: c.template_id || '',
            message_body: c.message_body || '',
            media_url: c.media_url || '',
            media_type: c.media_type || '',
            scheduled_at: c.scheduled_at ? c.scheduled_at.slice(0, 16) : '',
        });
        setEditing(c);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.patch(route('campaigns.update', editing.id), {
            onSuccess: () => setEditing(null),
        });
    };

    const action = (campaign, op) => router.post(route(`campaigns.${op}`, campaign.id));
    const remove = (campaign) => {
        if (confirm(`Delete campaign "${campaign.name}"?`)) {
            router.delete(route('campaigns.destroy', campaign.id));
        }
    };

    return (
        <AuthenticatedLayout title="Campaign Management" subtitle="Manage, schedule and send WhatsApp campaigns · کمپین مینجمنٹ">
            <Head title="Campaigns" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                    {selected.size > 0 && (
                        <div className="inline-flex items-center gap-2 bg-brand-light border border-brand/30 rounded-xl px-3 py-2 text-sm">
                            <span className="font-medium text-brand-dark">{selected.size} selected</span>
                            <button onClick={() => bulk('pause')} className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs">Pause</button>
                            <button onClick={() => bulk('resume')} className="px-2 py-0.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs">Resume</button>
                            <button onClick={() => bulk('delete')} className="px-2 py-0.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs">Delete</button>
                            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:underline">Clear</button>
                        </div>
                    )}
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-brand">
                    <Icon d="M12 4v16m8-8H4"/>
                    New Campaign
                </button>
            </div>

            {/* Filter bar */}
            <div className="card px-4 py-3 flex flex-wrap gap-3 items-center">
                <input type="text" defaultValue={filters.q || ''}
                       onKeyDown={(e) => e.key === 'Enter' && router.get('/campaigns', { ...filters, q: e.target.value }, { preserveState: true })}
                       placeholder="Search campaigns…"
                       className="border border-gray-200 rounded-xl text-sm px-3 py-2 flex-1 min-w-[200px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand"/>
                <select defaultValue={filters.type || ''}
                        onChange={(e) => router.get('/campaigns', { ...filters, type: e.target.value }, { preserveState: true })}
                        className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 text-gray-600">
                    <option value="">All Types</option>
                    <option value="promotional">Promotional</option>
                    <option value="transactional">Transactional</option>
                    <option value="broadcast">Broadcast</option>
                    <option value="drip">Drip</option>
                </select>
                <select defaultValue={filters.status || ''}
                        onChange={(e) => router.get('/campaigns', { ...filters, status: e.target.value }, { preserveState: true })}
                        className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 text-gray-600">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                <th className="px-5 py-3.5 w-5">
                                    <input type="checkbox" className="rounded accent-brand"
                                           checked={campaigns.data.length > 0 && selected.size === campaigns.data.length}
                                           onChange={toggleAll}/>
                                </th>
                                <th className="text-left px-3 py-3.5 font-medium">Campaign Name</th>
                                <th className="text-left px-3 py-3.5 font-medium">Type</th>
                                <th className="text-left px-3 py-3.5 font-medium">Audience</th>
                                <th className="text-left px-3 py-3.5 font-medium">Status</th>
                                <th className="text-left px-3 py-3.5 font-medium">Sent / Total</th>
                                <th className="text-left px-3 py-3.5 font-medium">Open Rate</th>
                                <th className="text-left px-3 py-3.5 font-medium">Schedule</th>
                                <th className="text-left px-3 py-3.5 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {campaigns.data.length === 0 && (
                                <tr><td colSpan="9" className="text-center py-12 text-gray-400 text-sm">No campaigns yet. Click "New Campaign" to create one.</td></tr>
                            )}
                            {campaigns.data.map((c) => {
                                const sent = c.sent_count || 0;
                                const total = c.total_recipients || 0;
                                const pct = total ? Math.round((sent / total) * 100) : 0;
                                const openRate = total ? Math.round(((c.read_count || 0) / Math.max(1, c.delivered_count || sent)) * 100) : 0;
                                return (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition group">
                                        <td className="px-5 py-4">
                                            <input type="checkbox" className="rounded accent-brand"
                                                   checked={selected.has(c.id)}
                                                   onChange={() => toggle(c.id)}/>
                                        </td>
                                        <td className="px-3 py-4">
                                            <p className="font-semibold text-gray-800" dir={/[؀-ۿ]/.test(c.name) ? 'rtl' : 'ltr'}>{c.name}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">Created {new Date(c.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-3 py-4">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${typePillClass(c.type)}`}>{c.type}</span>
                                        </td>
                                        <td className="px-3 py-4 text-gray-600">{c.segment?.name || 'All Contacts'}</td>
                                        <td className="px-3 py-4">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${badgeClass(c.status)}`}>{c.status}</span>
                                        </td>
                                        <td className="px-3 py-4">
                                            <p className="text-gray-800 font-medium">{sent.toLocaleString()} / {total.toLocaleString()}</p>
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1">
                                                <div className="h-1.5 bg-green-400 rounded-full" style={{ width: `${pct}%` }}/>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-gray-700 font-medium">{openRate}%</td>
                                        <td className="px-3 py-4 text-xs text-gray-500">
                                            {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (c.status === 'active' ? 'Daily 7:00 PM PKT' : '—')}
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                {c.status === 'draft' && (
                                                    <button onClick={() => action(c, 'start')} title="Start" className="p-1.5 hover:bg-green-50 rounded-lg text-green-600">
                                                        <Icon d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                                                    </button>
                                                )}
                                                {c.status === 'active' && (
                                                    <button onClick={() => action(c, 'pause')} title="Pause" className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-500">
                                                        <Icon d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                    </button>
                                                )}
                                                {c.status === 'paused' && (
                                                    <button onClick={() => action(c, 'resume')} title="Resume" className="p-1.5 hover:bg-green-50 rounded-lg text-green-600">
                                                        <Icon d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                                                    </button>
                                                )}
                                                <button onClick={() => openEdit(c)} title="Edit" className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500">
                                                    <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                </button>
                                                <button onClick={() => remove(c)} title="Delete" className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                                                    <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {campaigns.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 text-sm text-gray-500">
                        <div>{campaigns.from || 0}–{campaigns.to || 0} of {campaigns.total}</div>
                        <div className="flex gap-1">
                            {campaigns.links.map((l, i) => (
                                <Link key={i} href={l.url || ''} preserveScroll
                                      className={`px-3 py-1.5 rounded-lg ${l.active ? 'bg-brand text-white' : 'hover:bg-gray-100'} ${!l.url ? 'opacity-30 pointer-events-none' : ''}`}
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
                            <h3 className="font-bold text-gray-800 text-lg">Create New Campaign</h3>
                            <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">✕</button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                                <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)}
                                       placeholder="e.g. پاکستان بجٹ 2026"
                                       className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand" required/>
                                {form.errors.name && <div className="text-xs text-red-600 mt-1">{form.errors.name}</div>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="promotional">Promotional</option>
                                        <option value="transactional">Transactional</option>
                                        <option value="broadcast">Broadcast</option>
                                        <option value="drip">Drip</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                                    <select value={form.data.segment_id} onChange={(e) => form.setData('segment_id', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="">All active contacts</option>
                                        {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Template (optional)</label>
                                <select value={form.data.template_id} onChange={(e) => form.setData('template_id', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="">None — use message body</option>
                                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message body</label>
                                <textarea rows={4} value={form.data.message_body} onChange={(e) => form.setData('message_body', e.target.value)}
                                          placeholder="Enter your WhatsApp message or paste AI-generated script…"
                                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand resize-none"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule for (optional)</label>
                                <input type="datetime-local" value={form.data.scheduled_at}
                                       onChange={(e) => form.setData('scheduled_at', e.target.value)}
                                       className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand"/>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="btn-outline text-sm">Cancel</button>
                            <button disabled={form.processing} className="btn-brand text-sm">
                                {form.processing ? 'Creating…' : 'Create Campaign'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={submitEdit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 text-lg">Edit Campaign</h3>
                            <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">✕</button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                                <input value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)}
                                       className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand" required/>
                                {editForm.errors.name && <div className="text-xs text-red-600 mt-1">{editForm.errors.name}</div>}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select value={editForm.data.type} onChange={(e) => editForm.setData('type', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="promotional">Promotional</option>
                                        <option value="transactional">Transactional</option>
                                        <option value="broadcast">Broadcast</option>
                                        <option value="drip">Drip</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={editForm.data.status} onChange={(e) => editForm.setData('status', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="draft">Draft</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                                    <select value={editForm.data.segment_id} onChange={(e) => editForm.setData('segment_id', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="">All active</option>
                                        {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Template (optional)</label>
                                <select value={editForm.data.template_id} onChange={(e) => editForm.setData('template_id', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="">None — use message body</option>
                                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message body</label>
                                <textarea rows={4} value={editForm.data.message_body} onChange={(e) => editForm.setData('message_body', e.target.value)}
                                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand resize-none"/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
                                    <input value={editForm.data.media_url} onChange={(e) => editForm.setData('media_url', e.target.value)}
                                           placeholder="https://..."
                                           className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Media type</label>
                                    <select value={editForm.data.media_type} onChange={(e) => editForm.setData('media_type', e.target.value)}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule for (optional)</label>
                                <input type="datetime-local" value={editForm.data.scheduled_at}
                                       onChange={(e) => editForm.setData('scheduled_at', e.target.value)}
                                       className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setEditing(null)} className="btn-outline text-sm">Cancel</button>
                            <button disabled={editForm.processing} className="btn-brand text-sm">
                                {editForm.processing ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
