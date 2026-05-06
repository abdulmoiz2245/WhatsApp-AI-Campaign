import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

const fmt = (iso) => iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const StatusTick = ({ status }) => {
    if (status === 'read') return <span className="text-blue-400">✓✓</span>;
    if (status === 'delivered') return <span className="text-gray-400">✓✓</span>;
    if (status === 'sent') return <span className="text-gray-400">✓</span>;
    if (status === 'failed') return <span className="text-red-500">✕</span>;
    if (status === 'sending' || status === 'queued') return <span className="text-gray-300 animate-pulse">⌛</span>;
    return null;
};

export default function ContactShow({ contact, messages }) {
    const form = useForm({ body: '' });
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages.length]);

    const submit = (e) => {
        e.preventDefault();
        form.post(route('contacts.send', contact.id), {
            onSuccess: () => form.reset('body'),
            preserveScroll: true,
        });
    };

    const initial = (contact.name || contact.phone).slice(0, 1).toUpperCase();
    const isUrdu = (s) => /[؀-ۿ]/.test(s || '');

    return (
        <AuthenticatedLayout title={contact.name || contact.phone} subtitle={contact.phone}>
            <Head title={contact.name || contact.phone} />

            <Link href="/contacts" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Back to contacts
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Profile sidebar */}
                <div className="card p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || contact.phone)}&background=128C7E&color=fff&size=128`}
                             alt="" className="w-14 h-14 rounded-full"/>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{contact.name || '—'}</p>
                            <p className="text-xs text-gray-500 font-mono">{contact.phone}</p>
                            {contact.email && <p className="text-xs text-gray-500 truncate">{contact.email}</p>}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Status</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                contact.status === 'active' ? 'badge-active' :
                                contact.status === 'opted_out' ? 'badge-paused' : 'badge-failed'}`}>
                                {contact.status}
                            </span>
                        </div>
                        <div className="flex justify-between"><span className="text-gray-500">Country</span><span className="font-medium text-gray-700">{contact.country || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Language</span><span className="font-medium text-gray-700">{contact.language}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Last messaged</span><span className="font-medium text-gray-700">{contact.last_messaged_at ? new Date(contact.last_messaged_at).toLocaleString() : '—'}</span></div>
                    </div>

                    {contact.segments?.length > 0 && (
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Segments</p>
                            <div className="flex flex-wrap gap-1">
                                {contact.segments.map((s) => (
                                    <span key={s.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.color + '22', color: s.color }}>{s.name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Conversation */}
                <div className="lg:col-span-2 card flex flex-col" style={{ height: '70vh' }}>
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg,#128C7E,#25D366)' }}>{initial}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{contact.name || contact.phone}</p>
                            <p className="text-xs text-gray-500">WhatsApp · {messages.length} messages</p>
                        </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
                         style={{ background: 'linear-gradient(135deg,#0a121011,#25D36608)' }}>
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 text-sm py-12">No messages yet. Send the first one below.</div>
                        )}
                        {messages.map((m) => {
                            const me = m.direction === 'outbound';
                            return (
                                <div key={m.id} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${me ? 'bg-brand-light text-gray-800 rounded-br-md' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'}`}
                                         dir={isUrdu(m.body) ? 'rtl' : 'ltr'}>
                                        <p className="whitespace-pre-wrap">{m.body || (m.media_url ? '(media)' : '')}</p>
                                        {m.media_url && <a href={m.media_url} target="_blank" rel="noreferrer" className="text-xs text-brand-dark underline">View media</a>}
                                        <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 mt-1">
                                            <span>{fmt(m.sent_at || m.created_at)}</span>
                                            {me && <StatusTick status={m.status}/>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <form onSubmit={submit} className="border-t border-gray-100 px-3 py-3 flex items-center gap-2">
                        <input value={form.data.body} onChange={(e) => form.setData('body', e.target.value)}
                               placeholder="Type a message…"
                               className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand"
                               required/>
                        <button disabled={form.processing || !form.data.body.trim()} className="btn-brand px-4 py-2.5">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
