import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const ICONS = {
    grid: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
    megaphone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
    search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    film: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    settings: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
    newspaper: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />,
};

const Icon = ({ children, className = 'w-5 h-5 nav-icon' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{children}</svg>
);

const WaIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

const SECTIONS = [
    { label: 'Main', items: [
        { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'grid' },
        { id: 'campaigns', label: 'Campaigns', href: '/campaigns', icon: 'megaphone' },
    ]},
    { label: 'AI Tools', items: [
        { id: 'news', label: 'News Topics', href: '/news', icon: 'newspaper' },
        { id: 'research', label: 'AI Research', href: '/research', icon: 'search' },
        { id: 'pipeline', label: 'AI Pipeline', href: '/pipeline', icon: 'film' },
        { id: 'scheduler', label: 'Scheduler', href: '/scheduler', icon: 'calendar' },
    ]},
    { label: 'Manage', items: [
        { id: 'contacts', label: 'Contacts', href: '/contacts', icon: 'users' },
        { id: 'settings', label: 'Settings', href: '/settings', icon: 'settings' },
    ]},
];

export default function AuthenticatedLayout({ header, title, subtitle, children }) {
    const { auth, flash, notifications, errors } = usePage().props;
    const url = usePage().url;
    const [collapsed, setCollapsed] = useState(false);
    const [toast, setToast] = useState(null);
    const [bellOpen, setBellOpen] = useState(false);
    const [waStatus, setWaStatus] = useState({ loading: true, connected: false, label: 'Checking…' });

    useEffect(() => {
        let cancelled = false;
        const check = async () => {
            try {
                const r = await fetch('/settings/wppconnect/status', {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                const d = await r.json().catch(() => ({}));
                if (cancelled) return;
                const s = d.status;
                const connected = s === 'CONNECTED' || s === 'inChat' || s === true || d.state === 'CONNECTED';
                setWaStatus({
                    loading: false,
                    connected,
                    label: connected ? 'WA Connected' : (typeof s === 'string' ? `WA: ${s}` : 'WA Disconnected'),
                });
            } catch (e) {
                if (!cancelled) setWaStatus({ loading: false, connected: false, label: 'WA Offline' });
            }
        };
        check();
        const id = setInterval(check, 15000);
        return () => { cancelled = true; clearInterval(id); };
    }, []);

    useEffect(() => {
        if (flash?.success) setToast({ type: 'success', msg: flash.success });
        else if (flash?.error) setToast({ type: 'error', msg: flash.error });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const errorList = errors ? Object.values(errors).filter(Boolean) : [];
    const errorKey = errorList.join('|');
    useEffect(() => {
        if (errorList.length === 0) return;
        setToast({ type: 'error', msg: errorList.length === 1 ? errorList[0] : `${errorList.length} validation errors` });
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [errorKey]);

    const isActive = (href) => url === href || url.startsWith(href + '/') || url.startsWith(href + '?');
    const initial = (auth?.user?.name || '?').slice(0, 1).toUpperCase();
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(auth?.user?.name || 'Admin')}&background=128C7E&color=fff&size=64`;

    const pageTitle = title ?? (header && typeof header === 'string' ? header : 'Dashboard');

    return (
        <div className="bg-gray-50 font-sans flex min-h-screen">
            <aside id="sidebar" className={`bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 overflow-y-auto z-30 ${collapsed ? 'collapsed' : ''}`}>
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg,#128C7E,#25D366)' }}>
                        <WaIcon />
                    </div>
                    <div className="sidebar-logo-text min-w-0">
                        <p className="font-bold text-gray-800 text-sm leading-tight truncate">WA AI Chatbot</p>
                        <p className="text-gray-400 text-xs truncate">Campaign Platform</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {SECTIONS.map((s) => (
                        <div key={s.label} className="mb-2">
                            <p className="sidebar-section-label text-gray-400 text-xs font-semibold uppercase tracking-widest px-3 mb-2">{s.label}</p>
                            {s.items.map((n) => (
                                <Link key={n.id} href={n.href}
                                      className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 text-sm transition-all ${isActive(n.href) ? 'active' : ''}`}>
                                    <Icon>{ICONS[n.icon]}</Icon>
                                    <span className="nav-label">{n.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="px-3 pb-4 border-t border-gray-100 pt-3">
                    <Link href={route('profile.edit')} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50">
                        <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="nav-label min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{auth?.user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{auth?.user?.email}</p>
                        </div>
                    </Link>
                </div>
            </aside>

            <div id="main-content" className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-20 bg-white border-b border-gray-100 flex items-center gap-4 px-4 sm:px-6" style={{ height: 64 }}>
                    <button onClick={() => setCollapsed((x) => !x)} className="text-gray-500 hover:text-gray-800 transition p-1 rounded-lg hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                    <div>
                        <h1 className="font-bold text-gray-800 text-lg leading-tight">{pageTitle}</h1>
                        {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <Link href={route('settings.wppconnect')}
                              title="Open wppconnect QR / status"
                              className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                                  waStatus.loading
                                      ? 'bg-gray-50 border-gray-200 text-gray-500'
                                      : waStatus.connected
                                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                          : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                              }`}>
                            <span className={`w-2 h-2 rounded-full ${
                                waStatus.loading ? 'bg-gray-400'
                                : waStatus.connected ? 'bg-green-500 animate-pulse'
                                : 'bg-red-500 animate-pulse'
                            }`}></span>
                            {waStatus.label}
                        </Link>
                        <div className="hidden md:flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Next: 7:00 PM PKT
                        </div>
                        <div className="relative">
                            <button onClick={() => setBellOpen((x) => !x)}
                                    className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                                </svg>
                                {notifications?.unread > 0 && (
                                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">
                                        {notifications.unread}
                                    </span>
                                )}
                            </button>
                            {bellOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-800 text-sm">Notifications</h4>
                                            <span className="text-xs text-gray-400">{notifications?.unread || 0} new</span>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                                            {(!notifications?.items || notifications.items.length === 0) && (
                                                <div className="px-4 py-8 text-center text-sm text-gray-400">All caught up.</div>
                                            )}
                                            {notifications?.items?.map((n) => (
                                                <Link key={n.id} href={n.href} onClick={() => setBellOpen(false)}
                                                      className="block px-4 py-3 hover:bg-gray-50">
                                                    <div className="flex items-start gap-2">
                                                        <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                                            n.tone === 'error' ? 'bg-red-500' :
                                                            n.tone === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-800 truncate">{n.title}</p>
                                                            <p className="text-xs text-gray-500 truncate">{n.detail}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">{new Date(n.time).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <button onClick={() => router.post(route('logout'))} title="Sign out"
                                className="w-9 h-9 rounded-full ring-2 ring-green-200 overflow-hidden">
                            <img src={avatarUrl} alt="" />
                        </button>
                    </div>
                </header>

                <main className="p-4 sm:p-6 space-y-6">
                    {typeof header !== 'string' && header}
                    {children}
                </main>

                {toast && (
                    <div className={`fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                        <div>{toast.msg}</div>
                        {toast.type === 'error' && errorList.length > 1 && (
                            <ul className="mt-2 list-disc list-inside text-xs opacity-90 space-y-0.5">
                                {errorList.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
