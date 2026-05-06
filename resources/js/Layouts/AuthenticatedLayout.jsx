import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const NAV = [
    { name: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2 7-7 7 7 2 2v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z' },
    { name: 'Campaigns', href: '/campaigns', icon: 'M3 5h18M3 12h18M3 19h18' },
    { name: 'AI Research', href: '/research', icon: 'M9 11a4 4 0 100-8 4 4 0 000 8zm0 0v3m6 6l-3-3m0 0a4 4 0 11-6 0 4 4 0 016 0z' },
    { name: 'AI Pipeline', href: '/pipeline', icon: 'M3 4h18M3 12h18M3 20h18' },
    { name: 'Scheduler', href: '/scheduler', icon: 'M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' },
    { name: 'Contacts', href: '/contacts', icon: 'M16 11a4 4 0 10-8 0m12 8a4 4 0 00-8 0v1h8v-1zm-12 0a4 4 0 00-8 0v1h8v-1z' },
    { name: 'Settings', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function AuthenticatedLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const url = usePage().url;
    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (flash?.success) setToast({ type: 'success', msg: flash.success });
        else if (flash?.error) setToast({ type: 'error', msg: flash.error });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold">W</div>
                    <div>
                        <div className="font-bold text-gray-800">WA Campaign AI</div>
                        <div className="text-xs text-gray-400">Single user</div>
                    </div>
                </div>
                <nav className="p-3 space-y-1">
                    {NAV.map((item) => {
                        const active = url === item.href || url.startsWith(item.href + '/') || url.startsWith(item.href + '?');
                        return (
                            <Link key={item.name} href={item.href}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${active ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d={item.icon}/>
                                </svg>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                            {(auth?.user?.name || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{auth?.user?.name}</div>
                            <div className="text-xs text-gray-400 truncate">{auth?.user?.email}</div>
                        </div>
                        <button onClick={() => router.post(route('logout'))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400" title="Sign out">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3">
                    <button onClick={() => setOpen((x) => !x)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                    <div className="flex-1 min-w-0">{header}</div>
                </header>

                <main className="flex-1 p-4 sm:p-6 space-y-6">
                    {children}
                </main>

                {toast && (
                    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                        {toast.msg}
                    </div>
                )}
            </div>
        </div>
    );
}
