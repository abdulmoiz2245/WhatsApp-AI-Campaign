import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function ContactsIndex({ contacts, segments, stats, filters }) {
    const [showCreate, setShowCreate] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showSegment, setShowSegment] = useState(false);

    const form = useForm({ name: '', phone: '', email: '', country: '', language: 'en', segments: [] });
    const importForm = useForm({ file: null });
    const segForm = useForm({ name: '', description: '', color: '#7c3aed' });

    const submitContact = (e) => {
        e.preventDefault();
        form.post(route('contacts.store'), {
            onSuccess: () => { form.reset(); setShowCreate(false); },
        });
    };

    const submitImport = (e) => {
        e.preventDefault();
        importForm.post(route('contacts.import'), {
            forceFormData: true,
            onSuccess: () => { importForm.reset(); setShowImport(false); },
        });
    };

    const submitSegment = (e) => {
        e.preventDefault();
        segForm.post(route('segments.store'), {
            onSuccess: () => { segForm.reset(); setShowSegment(false); },
        });
    };

    const remove = (c) => confirm(`Delete ${c.name || c.phone}?`) && router.delete(route('contacts.destroy', c.id));

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Contacts & Audience</h2>
                    <p className="text-gray-400 text-sm">Manage recipients, segments, and broadcast lists.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowImport(true)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">Import CSV</button>
                    <button onClick={() => setShowSegment(true)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">+ Segment</button>
                    <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">+ Contact</button>
                </div>
            </div>
        }>
            <Head title="Contacts" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-xs text-gray-500 mt-1">Total contacts</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
                    <div className="text-xs text-gray-500 mt-1">Active</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">{stats.opted_out}</div>
                    <div className="text-xs text-gray-500 mt-1">Opted out</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.segments}</div>
                    <div className="text-xs text-gray-500 mt-1">Segments</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 text-sm">Segments</h3>
                    <div className="space-y-1">
                        <Link href="/contacts" className={`block px-3 py-2 rounded-lg text-sm ${!filters.segment ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}>
                            All contacts
                        </Link>
                        {segments.map((s) => (
                            <Link key={s.id} href={`/contacts?segment=${s.id}`}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${String(filters.segment) === String(s.id) ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}>
                                <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                                    {s.name}
                                </span>
                                <span className="text-xs text-gray-400">{s.contacts_count}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
                        <input type="text" defaultValue={filters.q || ''}
                               onKeyDown={(e) => e.key === 'Enter' && router.get('/contacts', { q: e.target.value }, { preserveState: true })}
                               placeholder="Search by name, phone, email…"
                               className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 bg-gray-50" />
                        <select defaultValue={filters.status || ''}
                                onChange={(e) => router.get('/contacts', { ...filters, status: e.target.value }, { preserveState: true })}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50">
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="opted_out">Opted out</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="text-left px-5 py-3 font-medium">Contact</th>
                                    <th className="text-left px-3 py-3 font-medium">Phone</th>
                                    <th className="text-left px-3 py-3 font-medium">Status</th>
                                    <th className="text-left px-3 py-3 font-medium">Segments</th>
                                    <th className="text-left px-3 py-3 font-medium">Last messaged</th>
                                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {contacts.data.length === 0 && <tr><td colSpan="6" className="text-center py-10 text-gray-400">No contacts yet.</td></tr>}
                                {contacts.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 group">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                                                    {(c.name || c.phone).slice(0, 1).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800">{c.name || '—'}</div>
                                                    <div className="text-xs text-gray-400">{c.email || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-gray-600">{c.phone}</td>
                                        <td className="px-3 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : c.status === 'opted_out' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(c.segments || []).map((s) => (
                                                    <span key={s.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.color + '22', color: s.color }}>
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-500">{c.last_messaged_at ? new Date(c.last_messaged_at).toLocaleString() : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button onClick={() => remove(c)} className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <form onSubmit={submitContact} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3">
                        <h3 className="font-bold text-lg">New Contact</h3>
                        <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)}
                               placeholder="Name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                        <input value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)}
                               placeholder="+1 555 0100" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" required/>
                        <input value={form.data.email} onChange={(e) => form.setData('email', e.target.value)}
                               placeholder="Email (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                        <div className="grid grid-cols-2 gap-3">
                            <input value={form.data.country} onChange={(e) => form.setData('country', e.target.value)}
                                   placeholder="Country" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                            <input value={form.data.language} onChange={(e) => form.setData('language', e.target.value)}
                                   placeholder="Lang" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">Cancel</button>
                            <button disabled={form.processing} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Create</button>
                        </div>
                    </form>
                </div>
            )}

            {showImport && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <form onSubmit={submitImport} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3">
                        <h3 className="font-bold text-lg">Import Contacts (CSV)</h3>
                        <p className="text-sm text-gray-500">Headers: name,phone,email,country,language. Phone is required.</p>
                        <input type="file" accept=".csv,text/csv" onChange={(e) => importForm.setData('file', e.target.files[0])}
                               className="w-full text-sm" required/>
                        {importForm.errors.file && <div className="text-xs text-red-600">{importForm.errors.file}</div>}
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">Cancel</button>
                            <button disabled={importForm.processing} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Import</button>
                        </div>
                    </form>
                </div>
            )}

            {showSegment && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <form onSubmit={submitSegment} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3">
                        <h3 className="font-bold text-lg">New Segment</h3>
                        <input value={segForm.data.name} onChange={(e) => segForm.setData('name', e.target.value)}
                               placeholder="Segment name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" required/>
                        <input value={segForm.data.description} onChange={(e) => segForm.setData('description', e.target.value)}
                               placeholder="Description" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Color</span>
                            <input type="color" value={segForm.data.color} onChange={(e) => segForm.setData('color', e.target.value)}/>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowSegment(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">Cancel</button>
                            <button disabled={segForm.processing} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Create</button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
