import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function ContactsIndex({ contacts, segments, stats, filters }) {
    const [showCreate, setShowCreate] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showSegment, setShowSegment] = useState(false);

    const form = useForm({ name: '', phone: '', email: '', country: '', language: 'ur' });
    const importForm = useForm({ file: null });
    const segForm = useForm({ name: '', description: '', color: '#25D366' });

    const submitContact = (e) => {
        e.preventDefault();
        form.post(route('contacts.store'), { onSuccess: () => { form.reset(); setShowCreate(false); } });
    };
    const submitImport = (e) => {
        e.preventDefault();
        importForm.post(route('contacts.import'), { forceFormData: true, onSuccess: () => { importForm.reset(); setShowImport(false); } });
    };
    const submitSegment = (e) => {
        e.preventDefault();
        segForm.post(route('segments.store'), { onSuccess: () => { segForm.reset(); setShowSegment(false); } });
    };
    const remove = (c) => confirm(`Delete ${c.name || c.phone}?`) && router.delete(route('contacts.destroy', c.id));

    return (
        <AuthenticatedLayout title="Contacts & Audience" subtitle="WhatsApp contacts, segments and broadcast groups · رابطے اور ناظرین">
            <Head title="Contacts" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1"></div>
                <div className="flex gap-3">
                    <button onClick={() => setShowImport(true)} className="btn-outline text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                        </svg>
                        Import CSV
                    </button>
                    <button onClick={() => setShowCreate(true)} className="btn-brand text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Add Contact
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-gray-800">{stats.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Contacts</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Active</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-amber-500">{stats.opted_out.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Unsubscribed</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.segments}</p>
                    <p className="text-xs text-gray-500 mt-1">Segments</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Segments */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">Segments</h3>
                        <button onClick={() => setShowSegment(true)} className="text-xs text-brand-dark font-medium hover:underline">+ New</button>
                    </div>
                    <div className="space-y-2">
                        <Link href="/contacts" className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${!filters.segment ? 'bg-brand-light' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
                                <span className={`text-sm ${!filters.segment ? 'font-medium text-gray-800' : 'text-gray-700'}`}>All Contacts</span>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{stats.total.toLocaleString()}</span>
                        </Link>
                        {segments.map((s) => (
                            <Link key={s.id} href={`/contacts?segment=${s.id}`}
                                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${String(filters.segment) === String(s.id) ? 'bg-brand-light' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }}></span>
                                    <span className={`text-sm ${String(filters.segment) === String(s.id) ? 'font-medium text-gray-800' : 'text-gray-700'}`}>{s.name}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-700">{(s.contacts_count || 0).toLocaleString()}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="lg:col-span-2 card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
                        <input type="text" defaultValue={filters.q || ''}
                               onKeyDown={(e) => e.key === 'Enter' && router.get('/contacts', { ...filters, q: e.target.value }, { preserveState: true })}
                               placeholder="Search by name, phone, email…"
                               className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[180px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand"/>
                        <select defaultValue={filters.status || ''}
                                onChange={(e) => router.get('/contacts', { ...filters, status: e.target.value }, { preserveState: true })}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-600">
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="opted_out">Unsubscribed</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                    <th className="text-left px-5 py-3 font-medium">Contact</th>
                                    <th className="text-left px-3 py-3 font-medium">Phone</th>
                                    <th className="text-left px-3 py-3 font-medium">Status</th>
                                    <th className="text-left px-3 py-3 font-medium">Segments</th>
                                    <th className="text-left px-3 py-3 font-medium">Last Msg</th>
                                    <th className="text-right px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {contacts.data.length === 0 && <tr><td colSpan="6" className="text-center py-12 text-gray-400 text-sm">No contacts in this segment.</td></tr>}
                                {contacts.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 group">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || c.phone)}&background=128C7E&color=fff&size=64`}
                                                     alt="" className="w-8 h-8 rounded-full"/>
                                                <div>
                                                    <p className="font-medium text-gray-800">{c.name || '—'}</p>
                                                    <p className="text-xs text-gray-400">{c.email || ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-gray-600 font-mono text-xs">{c.phone}</td>
                                        <td className="px-3 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                c.status === 'active' ? 'badge-active' :
                                                c.status === 'opted_out' ? 'badge-paused' : 'badge-failed'}`}>{c.status}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(c.segments || []).map((s) => (
                                                    <span key={s.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.color + '22', color: s.color }}>{s.name}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-500">{c.last_messaged_at ? new Date(c.last_messaged_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button onClick={() => remove(c)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showCreate && <Modal onClose={() => setShowCreate(false)}>
                <form onSubmit={submitContact} className="space-y-3">
                    <h3 className="font-bold text-gray-800 text-lg">New Contact</h3>
                    <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                    <input value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} placeholder="+92 300 1234567" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" required/>
                    <input value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} placeholder="Email (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                    <div className="grid grid-cols-2 gap-3">
                        <input value={form.data.country} onChange={(e) => form.setData('country', e.target.value)} placeholder="Country" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                        <select value={form.data.language} onChange={(e) => form.setData('language', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                            <option value="ur">Urdu</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="btn-outline text-sm">Cancel</button>
                        <button disabled={form.processing} className="btn-brand text-sm">Create</button>
                    </div>
                </form>
            </Modal>}

            {showImport && <Modal onClose={() => setShowImport(false)}>
                <form onSubmit={submitImport} className="space-y-3">
                    <h3 className="font-bold text-gray-800 text-lg">Import Contacts (CSV)</h3>
                    <p className="text-sm text-gray-500">Headers: name,phone,email,country,language. Phone is required.</p>
                    <input type="file" accept=".csv,text/csv" onChange={(e) => importForm.setData('file', e.target.files[0])} className="w-full text-sm" required/>
                    {importForm.errors.file && <div className="text-xs text-red-600">{importForm.errors.file}</div>}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowImport(false)} className="btn-outline text-sm">Cancel</button>
                        <button disabled={importForm.processing} className="btn-brand text-sm">Import</button>
                    </div>
                </form>
            </Modal>}

            {showSegment && <Modal onClose={() => setShowSegment(false)}>
                <form onSubmit={submitSegment} className="space-y-3">
                    <h3 className="font-bold text-gray-800 text-lg">New Segment</h3>
                    <input value={segForm.data.name} onChange={(e) => segForm.setData('name', e.target.value)} placeholder="Segment name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" required/>
                    <input value={segForm.data.description} onChange={(e) => segForm.setData('description', e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Color</span>
                        <input type="color" value={segForm.data.color} onChange={(e) => segForm.setData('color', e.target.value)}/>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowSegment(false)} className="btn-outline text-sm">Cancel</button>
                        <button disabled={segForm.processing} className="btn-brand text-sm">Create</button>
                    </div>
                </form>
            </Modal>}
        </AuthenticatedLayout>
    );
}

function Modal({ children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
