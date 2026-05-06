import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Welcome({ canRegister }) {
    const { auth } = usePage().props;

    useEffect(() => {
        if (auth?.user && typeof window !== 'undefined') window.location.replace('/dashboard');
    }, [auth?.user]);

    const form = useForm({ email: '', password: '', remember: false });

    const submit = (e) => {
        e.preventDefault();
        form.post('/login', { onFinish: () => form.reset('password') });
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 font-sans"
             style={{ background: 'linear-gradient(135deg,#128C7E,#065f46,#134e4a)' }}>
            <Head title="Sign in" />

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl" style={{ background: '#25D36633' }}></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ background: '#5eead411' }}></div>
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="px-8 py-7 text-center" style={{ background: 'linear-gradient(135deg,#128C7E,#25D366)' }}>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-3 backdrop-blur-sm">
                            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
                            </svg>
                        </div>
                        <h1 className="text-white text-2xl font-bold tracking-tight">WhatsApp AI Chatbot</h1>
                        <p className="text-emerald-100 text-sm mt-1">Campaign & Research Automation Platform</p>
                        <p className="text-emerald-200 text-xs mt-0.5 font-light">واٹس ایپ اے آئی کمپین مینجمنٹ</p>
                    </div>

                    <form onSubmit={submit} className="px-8 py-8 space-y-5">
                        <div>
                            <h2 className="text-gray-800 text-xl font-semibold mb-1">Welcome back 👋</h2>
                            <p className="text-gray-500 text-sm">Sign in to your admin dashboard</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <input type="email" autoFocus required value={form.data.email}
                                   onChange={(e) => form.setData('email', e.target.value)}
                                   placeholder="admin@wachatbot.ai"
                                   className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand"/>
                            {form.errors.email && <p className="text-xs text-red-600 mt-1">{form.errors.email}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <Link href="/forgot-password" className="text-xs text-brand-dark hover:underline">Forgot password?</Link>
                            </div>
                            <input type="password" required value={form.data.password}
                                   onChange={(e) => form.setData('password', e.target.value)}
                                   placeholder="••••••••"
                                   className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand"/>
                            {form.errors.password && <p className="text-xs text-red-600 mt-1">{form.errors.password}</p>}
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={form.data.remember}
                                   onChange={(e) => form.setData('remember', e.target.checked)} className="rounded accent-brand"/>
                            Remember me
                        </label>

                        <button disabled={form.processing} className="btn-brand w-full justify-center py-3">
                            {form.processing ? 'Signing in…' : 'Sign In'}
                        </button>

                        {canRegister && (
                            <p className="text-center text-sm text-gray-500">
                                No account? <Link href="/register" className="text-brand-dark font-medium hover:underline">Create one</Link>
                            </p>
                        )}
                    </form>
                </div>

                <p className="text-center text-emerald-100 text-xs mt-6">© 2026 WA AI Chatbot · Campaign Platform</p>
            </div>
        </div>
    );
}
