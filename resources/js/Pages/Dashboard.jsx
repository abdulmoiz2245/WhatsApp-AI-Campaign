import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const KPI = ({ label, value, hint, color = 'emerald' }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
        <div className={`mt-1 text-2xl font-bold text-${color}-600`}>{value}</div>
        {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
);

const Sparkline = ({ data }) => {
    const max = Math.max(1, ...data.map((d) => d.total));
    return (
        <div className="flex items-end gap-1 h-32">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full bg-emerald-100 rounded-t-md transition-all group-hover:bg-emerald-200"
                         style={{ height: `${(d.total / max) * 100}%` }} title={`${d.day}: ${d.total}`}/>
                    <div className="text-[10px] text-gray-400">{d.day.slice(5)}</div>
                </div>
            ))}
        </div>
    );
};

export default function Dashboard({ kpis, trend, by_type, recent_activity }) {
    return (
        <AuthenticatedLayout header={
            <div>
                <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-gray-400 text-sm">Overview of your WhatsApp AI campaigns</p>
            </div>
        }>
            <Head title="Dashboard" />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPI label="Campaigns" value={kpis.total_campaigns} hint={`${kpis.active_campaigns} active`} color="indigo" />
                <KPI label="Contacts" value={kpis.total_contacts} hint="Active recipients" color="emerald" />
                <KPI label="Messages Sent" value={kpis.messages_sent} color="purple" />
                <KPI label="Delivery Rate" value={`${kpis.delivery_rate}%`} color="blue" />
                <KPI label="Pipelines" value={kpis.pipeline_jobs_running} hint="Currently running" color="amber" />
                <KPI label="Today's Posts" value={kpis.scheduled_today} hint="Auto-publish queued" color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">Delivery Trend (last 14 days)</h3>
                    </div>
                    <Sparkline data={trend} />
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3">Campaigns by Type</h3>
                    <div className="space-y-2">
                        {Object.keys(by_type || {}).length === 0 && <div className="text-sm text-gray-400">No campaigns yet.</div>}
                        {Object.entries(by_type || {}).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 capitalize">{type}</span>
                                <span className="font-semibold text-gray-800">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                    <Link href="/campaigns" className="text-sm text-emerald-600 hover:underline">View all</Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {recent_activity.length === 0 && (
                        <div className="px-5 py-6 text-sm text-gray-400 text-center">No activity yet.</div>
                    )}
                    {recent_activity.map((m) => (
                        <div key={m.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                m.status === 'delivered' || m.status === 'read' ? 'bg-green-50 text-green-600' :
                                m.status === 'failed' ? 'bg-red-50 text-red-600' :
                                'bg-gray-100 text-gray-600'}`}>
                                {m.status}
                            </span>
                            <span className="text-gray-700 flex-1 truncate">
                                <strong>{m.contact?.name || m.contact?.phone || '—'}</strong>: {m.body || '(media)'}
                            </span>
                            <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
