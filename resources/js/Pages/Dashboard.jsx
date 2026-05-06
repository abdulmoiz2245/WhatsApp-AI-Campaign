import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

const KpiCard = ({ label, value, sub, icon, tone }) => (
    <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">{label}</p>
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${tone}-50`}>
                <svg className={`w-4 h-4 text-${tone}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
            </span>
        </div>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {sub && <p className={`text-xs text-${tone}-600 mt-1`}>{sub}</p>}
    </div>
);

const badgeClass = (s) => ({
    active: 'badge-active', scheduled: 'badge-scheduled', paused: 'badge-paused',
    draft: 'badge-draft', failed: 'badge-failed', completed: 'badge-completed',
}[s] || 'badge-draft');

function buildLinePath(values, w = 520, h = 110, pad = 6) {
    if (!values.length) return { line: '', area: '' };
    const max = Math.max(1, ...values);
    const stepX = (w - pad * 2) / Math.max(1, values.length - 1);
    const points = values.map((v, i) => [pad + i * stepX, h - pad - (v / max) * (h - pad * 2)]);
    const cmds = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
    const area = `${cmds} L${pad + (values.length - 1) * stepX},${h} L${pad},${h} Z`;
    return { line: cmds, area };
}

function buildDonut(parts) {
    const total = Math.max(1, parts.reduce((s, p) => s + p.value, 0));
    const C = 2 * Math.PI * 45;
    let acc = 0;
    return parts.map((p) => {
        const len = (p.value / total) * C;
        const seg = { ...p, dasharray: `${len} ${C}`, offset: -acc };
        acc += len;
        return seg;
    });
}

export default function Dashboard({ kpis, trend, by_type, recent_campaigns, recent_activity }) {
    const { auth } = usePage().props;
    const userName = (auth?.user?.name || 'Admin').split(' ')[0];
    const lineValues = trend.map((d) => d.total);
    const { line, area } = useMemo(() => buildLinePath(lineValues), [trend]);

    const total = Object.values(by_type || {}).reduce((s, n) => s + n, 0);
    const palette = ['#25D366', '#3b82f6', '#a78bfa', '#f59e0b', '#ef4444'];
    const donutParts = Object.entries(by_type || {}).map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }));
    const donut = buildDonut(donutParts);

    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    }, []);

    return (
        <AuthenticatedLayout title="Dashboard" subtitle="Overview · ڈیش بورڈ">
            <Head title="Dashboard" />

            {/* Greeting banner */}
            <div className="rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: 'linear-gradient(135deg,#128C7E,#25D366)' }}>
                <div className="flex-1">
                    <p className="text-emerald-100 text-sm">{greeting}, {userName} 👋</p>
                    <h2 className="text-2xl font-bold mt-0.5">Campaign Overview</h2>
                    <p className="text-emerald-100 text-sm mt-1">
                        اگلی اشاعت <span className="font-semibold text-white">7:00 PM PKT</span> · Asia/Karachi
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/campaigns" className="bg-white/20 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/30 transition">New Campaign</Link>
                    <Link href="/research" className="bg-white text-brand-dark text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition">+ AI Research</Link>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Active Campaigns" value={kpis.active_campaigns} sub={`${kpis.total_campaigns} total`} tone="green"
                         icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>}/>
                <KpiCard label="Messages Sent" value={kpis.messages_sent.toLocaleString()} sub={`Delivery ${kpis.delivery_rate}%`} tone="blue"
                         icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>}/>
                <KpiCard label="Videos Generated" value={kpis.videos_generated} sub={`${kpis.pipeline_jobs_running} running`} tone="purple"
                         icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>}/>
                <KpiCard label="Total Contacts" value={kpis.total_contacts.toLocaleString()} sub={`${kpis.scheduled_today} scheduled today`} tone="amber"
                         icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>}/>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Message Delivery Trend</h3>
                            <p className="text-gray-400 text-xs mt-0.5">Last 14 days</p>
                        </div>
                    </div>
                    <svg viewBox="0 0 520 120" className="w-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#25D366" stopOpacity=".3"/>
                                <stop offset="100%" stopColor="#25D366" stopOpacity="0"/>
                            </linearGradient>
                        </defs>
                        <path d={area} fill="url(#g1)"/>
                        <path d={line} fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <div className="flex justify-between mt-2">
                        {trend.length > 0 && [0, Math.floor(trend.length / 3), Math.floor(2 * trend.length / 3), trend.length - 1].map((idx) => (
                            <span key={idx} className="text-gray-400 text-xs">{trend[idx]?.day.slice(5)}</span>
                        ))}
                    </div>
                </div>

                <div className="card p-5">
                    <h3 className="font-semibold text-gray-800 mb-1">Campaign Types</h3>
                    <p className="text-gray-400 text-xs mb-4">By category</p>
                    {donut.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-12">No campaigns yet.</div>
                    ) : (
                        <>
                            <div className="flex justify-center">
                                <svg viewBox="0 0 120 120" className="w-28 h-28">
                                    <circle cx="60" cy="60" r="45" fill="none" stroke="#e2e8f0" strokeWidth="20"/>
                                    {donut.map((s, i) => (
                                        <circle key={i} cx="60" cy="60" r="45" fill="none" stroke={s.color} strokeWidth="20"
                                                strokeDasharray={s.dasharray} strokeDashoffset={s.offset} transform="rotate(-90 60 60)"/>
                                    ))}
                                    <text x="60" y="64" textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: '#1e293b' }}>{total}</text>
                                    <text x="60" y="76" textAnchor="middle" style={{ fontSize: 8, fill: '#94a3b8' }}>Total</text>
                                </svg>
                            </div>
                            <div className="space-y-2 mt-4">
                                {donut.map((s) => (
                                    <div key={s.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }}></span>
                                            <span className="text-gray-600 capitalize">{s.name}</span>
                                        </div>
                                        <span className="font-semibold text-gray-800">{Math.round((s.value / total) * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Recent campaigns + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Recent Campaigns</h3>
                        <Link href="/campaigns" className="text-brand-dark text-sm font-medium hover:underline">View all →</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                    <th className="text-left px-5 py-3 font-medium">Campaign</th>
                                    <th className="text-left px-3 py-3 font-medium">Type</th>
                                    <th className="text-left px-3 py-3 font-medium">Status</th>
                                    <th className="text-left px-3 py-3 font-medium">Sent</th>
                                    <th className="text-left px-3 py-3 font-medium">Schedule</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recent_campaigns.length === 0 && (
                                    <tr><td colSpan="5" className="text-center py-10 text-gray-400 text-sm">No campaigns yet.</td></tr>
                                )}
                                {recent_campaigns.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition">
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-gray-800">{c.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 capitalize">{c.type}</p>
                                        </td>
                                        <td className="px-3 py-3.5 text-gray-500 capitalize">{c.type}</td>
                                        <td className="px-3 py-3.5">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${badgeClass(c.status)}`}>{c.status}</span>
                                        </td>
                                        <td className="px-3 py-3.5 text-gray-700">{(c.sent_count || 0).toLocaleString()}</td>
                                        <td className="px-3 py-3.5 text-gray-500 text-xs">
                                            {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
                    {recent_activity.length === 0 ? (
                        <p className="text-sm text-gray-400">No activity yet.</p>
                    ) : (
                        <ol className="relative border-l border-gray-100 space-y-5 pl-4">
                            {recent_activity.map((m, i) => {
                                const colors = ['bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-amber-400', 'bg-gray-300'];
                                return (
                                    <li key={m.id} className="relative">
                                        <span className={`absolute -left-6 w-3 h-3 rounded-full ring-2 ring-white ${colors[i % colors.length]}`}></span>
                                        <p className="text-sm font-medium text-gray-800">
                                            {m.contact?.name || m.contact?.phone || 'Subscriber'}
                                            <span className="font-normal text-gray-500"> — {m.status}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{m.body || '(media)'} · {fmtAge(m.created_at)}</p>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function fmtAge(iso) {
    if (!iso) return '';
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

