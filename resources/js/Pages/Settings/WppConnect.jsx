import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.content
    || decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))?.split('=')[1] || '');

const post = (url, body) =>
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': csrf() },
        credentials: 'same-origin',
        body: JSON.stringify(body || {}),
    }).then((r) => r.json().catch(() => ({})));

const get = (url) =>
    fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then((r) => r.json().catch(() => ({})));

export default function WppConnect({ session, baseUrl, webhook_url }) {
    const [status, setStatus] = useState(null);
    const [qr, setQr] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const pollRef = useRef(null);

    const refresh = async () => {
        try {
            const data = await get(route('settings.wppconnect.qr'));
            if (data.qrcode) setQr(data.qrcode);
            else setQr(null);
            setStatus(data.status || null);
        } catch (e) {
            setError(e.message);
        }
    };

    const start = async () => {
        setBusy(true);
        setError(null);
        try {
            await post(route('settings.wppconnect.start'));
            await refresh();
            // Poll every 2s for QR / connected.
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(refresh, 2000);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const logout = async () => {
        if (!confirm('Logout this WhatsApp session?')) return;
        setBusy(true);
        try {
            await post(route('settings.wppconnect.logout'));
            setQr(null);
            await refresh();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        refresh();
        return () => pollRef.current && clearInterval(pollRef.current);
    }, []);

    useEffect(() => {
        // Stop polling once connected.
        if (status?.status === 'CONNECTED' || status?.status === 'inChat') {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }
    }, [status]);

    const connected = status?.status === 'CONNECTED' || status?.status === 'inChat' || status?.status === true;

    return (
        <AuthenticatedLayout title="wppconnect — QR Connect" subtitle="Scan QR to link WhatsApp · self-hosted">
            <Head title="wppconnect" />

            <div className="card p-6 space-y-5 max-w-3xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <span className="text-green-700 font-bold">W</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">wppconnect Session</h3>
                        <p className="text-gray-400 text-xs">Server: {baseUrl} · Session: <code>{session}</code></p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></span>
                        <span className={`text-sm font-medium ${connected ? 'text-green-700' : 'text-gray-500'}`}>
                            {connected ? 'Connected' : (status?.status || 'Disconnected')}
                        </span>
                    </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    Webhook URL (auto-set on session start): <code className="text-gray-700">{webhook_url}</code>
                </div>

                {error && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
                )}

                <div className="flex gap-3">
                    <button onClick={start} disabled={busy} className="btn-brand text-sm">
                        {busy ? 'Working…' : (connected ? 'Restart Session' : 'Start Session / Show QR')}
                    </button>
                    <button onClick={refresh} disabled={busy} className="btn-outline text-sm">Refresh status</button>
                    {connected && (
                        <button onClick={logout} disabled={busy} className="btn-outline text-sm text-red-600 border-red-200 ml-auto">Logout</button>
                    )}
                </div>

                <div className="border-t border-gray-100 pt-5">
                    {connected ? (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-4">
                            ✓ WhatsApp connected. Outgoing messages from this app will route via wppconnect.
                        </div>
                    ) : qr ? (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-sm text-gray-600">Open WhatsApp → Settings → Linked Devices → Link a device, then scan:</p>
                            <img src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`}
                                 alt="QR" className="w-72 h-72 border rounded-xl" />
                            <p className="text-xs text-gray-400">QR refreshes every 2s. Page polls until connected.</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No QR yet. Click "Start Session" to begin.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
