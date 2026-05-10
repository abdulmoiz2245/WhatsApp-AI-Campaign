import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const TABS = [
    { id: 'wa', label: 'WhatsApp API' },
    { id: 'ai', label: 'AI Config' },
    { id: 'media', label: 'Voice & Video' },
    { id: 'sched', label: 'Scheduler' },
    { id: 'notif', label: 'Notifications' },
];

const Field = ({ label, children, hint }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        {children}
        {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
);

const Input = ({ value, onChange, type = 'text', placeholder, ...rest }) => (
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
           className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand" {...rest} />
);

const Secret = ({ configured, value, onChange, placeholder }) => (
    <div className="relative">
        <input type="password" value={value || ''} onChange={(e) => onChange(e.target.value)}
               placeholder={configured ? '••••••••  (saved — leave blank to keep)' : (placeholder || 'sk-...')}
               className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-24 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand"/>
        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full ${configured ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {configured ? 'configured' : 'not set'}
        </span>
    </div>
);

const ConnectedPill = ({ connected, label = 'Connected' }) => (
    <div className="ml-auto flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></span>
        <span className={`text-sm font-medium ${connected ? 'text-green-700' : 'text-gray-500'}`}>{connected ? label : 'Not connected'}</span>
    </div>
);

export default function SettingsIndex({ settings, configured, webhook_url }) {
    const [tab, setTab] = useState('wa');
    const [testing, setTesting] = useState(null);
    const [testResult, setTestResult] = useState({});
    const form = useForm({
        ...settings,
        meta_access_token: '', twilio_auth_token: '', openai_api_key: '',
        anthropic_api_key: '', elevenlabs_api_key: '', heygen_api_key: '',
        wppconnect_secret: '', wppconnect_webhook_secret: '',
    });

    const submit = (e) => { e.preventDefault(); form.patch(route('settings.update'), { preserveScroll: true }); };
    const set = (k) => (v) => form.setData(k, v);

    const testConnection = async (provider) => {
        setTesting(provider);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.content
                || decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))?.split('=')[1] || '');
            const resp = await fetch(route('settings.test'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': csrf },
                credentials: 'same-origin',
                body: JSON.stringify({ provider }),
            });
            const data = await resp.json().catch(() => ({}));
            setTestResult((r) => ({ ...r, [provider]: { ok: resp.ok && data.ok, message: data.message || (resp.ok ? 'OK' : 'Failed') } }));
        } catch (e) {
            setTestResult((r) => ({ ...r, [provider]: { ok: false, message: e.message } }));
        } finally {
            setTesting(null);
        }
    };

    const TestButton = ({ provider, label = 'Test Connection' }) => (
        <div className="inline-flex items-center gap-3">
            <button type="button" onClick={() => testConnection(provider)}
                    disabled={testing === provider}
                    className="btn-outline text-sm">
                {testing === provider ? 'Testing…' : label}
            </button>
            {testResult[provider] && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${testResult[provider].ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {testResult[provider].ok ? '✓ ' : '✕ '}{testResult[provider].message}
                </span>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout title="Settings" subtitle="WhatsApp API · AI Config · Notifications · Account · ترتیبات">
            <Head title="Settings" />

            {/* Pill tabs */}
            <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
                {TABS.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                            className={`settings-tab text-sm font-medium px-4 py-2 rounded-xl transition whitespace-nowrap ${
                                tab === t.id ? 'active-tab' : 'text-gray-600 hover:bg-gray-50'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <form onSubmit={submit}>
                {tab === 'wa' && (
                    <div className="card p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-brand-dark" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">WhatsApp Business API</h3>
                                <p className="text-gray-400 text-xs">Connect via Meta Cloud API or Twilio</p>
                            </div>
                            <ConnectedPill connected={
                                form.data.whatsapp_driver === 'meta' ? configured.meta
                                : form.data.whatsapp_driver === 'twilio' ? configured.twilio
                                : configured.wppconnect
                            }/>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Provider">
                                <select value={form.data.whatsapp_driver || 'meta'} onChange={(e) => form.setData('whatsapp_driver', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="meta">Meta Cloud API (official)</option>
                                    <option value="twilio">Twilio</option>
                                    <option value="wppconnect">wppconnect (self-hosted, QR scan)</option>
                                </select>
                            </Field>
                            <Field label="Webhook URL" hint="Configure this in your provider's webhook settings.">
                                <Input value={webhook_url} onChange={() => {}} readOnly />
                            </Field>

                            {form.data.whatsapp_driver === 'meta' && <>
                                <Field label="Phone Number ID"><Input value={form.data.meta_phone_number_id} onChange={set('meta_phone_number_id')} placeholder="1234567890123456"/></Field>
                                <Field label="Business Account ID"><Input value={form.data.meta_business_account_id} onChange={set('meta_business_account_id')} placeholder="9876543210987654"/></Field>
                                <div className="sm:col-span-2"><Field label="Access Token"><Secret configured={configured.meta} value={form.data.meta_access_token} onChange={set('meta_access_token')} placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"/></Field></div>
                                <Field label="Webhook Verify Token"><Input value={form.data.meta_verify_token} onChange={set('meta_verify_token')} placeholder="my_webhook_token_2026"/></Field>
                            </>}
                            {form.data.whatsapp_driver === 'twilio' && <>
                                <Field label="Account SID"><Input value={form.data.twilio_account_sid} onChange={set('twilio_account_sid')}/></Field>
                                <Field label="Auth Token"><Secret configured={configured.twilio} value={form.data.twilio_auth_token} onChange={set('twilio_auth_token')}/></Field>
                                <Field label="From (whatsapp:+...)"><Input value={form.data.twilio_whatsapp_from} onChange={set('twilio_whatsapp_from')}/></Field>
                            </>}
                            {form.data.whatsapp_driver === 'wppconnect' && <>
                                <Field label="Server Base URL" hint="Where wppconnect-server is reachable (services/wppconnect-server, default port 21465)."><Input value={form.data.wppconnect_base_url} onChange={set('wppconnect_base_url')} placeholder="http://localhost:21465" autoComplete="off"/></Field>
                                <Field label="Session Name" hint="Logical session id. One QR per session."><Input value={form.data.wppconnect_session} onChange={set('wppconnect_session')} placeholder="default" autoComplete="off"/></Field>
                                <div className="sm:col-span-2"><Field label="Server Secret Key" hint="Match `secretKey` in wppconnect-server config."><Secret configured={configured.wppconnect} value={form.data.wppconnect_secret} onChange={set('wppconnect_secret')} placeholder="THISISMYSECURETOKEN" autoComplete="new-password"/></Field></div>
                                <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                                    Save settings, then open the <a href={route('settings.wppconnect')} className="underline font-medium">QR Connect page</a> to scan the WhatsApp QR.
                                </div>
                            </>}
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2 items-center">
                            <TestButton provider="whatsapp"/>
                            <button disabled={form.processing} className="btn-brand text-sm ml-auto">Save API Settings</button>
                        </div>
                    </div>
                )}

                {tab === 'ai' && (
                    <div className="card p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">AI Engine Configuration</h3>
                                <p className="text-gray-400 text-xs">Models for research, scripts, and thumbnails</p>
                            </div>
                            <ConnectedPill connected={form.data.ai_text_driver === 'openai' ? configured.openai : configured.anthropic} label="API Key Set"/>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Text driver">
                                <select value={form.data.ai_text_driver || 'openai'} onChange={(e) => form.setData('ai_text_driver', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="openai">OpenAI (GPT)</option>
                                    <option value="anthropic">Anthropic (Claude)</option>
                                </select>
                            </Field>
                            <Field label="Image driver">
                                <select value={form.data.ai_image_driver || 'openai'} onChange={(e) => form.setData('ai_image_driver', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="openai">OpenAI (DALL-E)</option>
                                </select>
                            </Field>

                            <div className="sm:col-span-2"><Field label="OpenAI API key"><Secret configured={configured.openai} value={form.data.openai_api_key} onChange={set('openai_api_key')}/></Field></div>
                            <Field label="OpenAI text model"><Input value={form.data.openai_text_model} onChange={set('openai_text_model')} placeholder="gpt-4o-mini"/></Field>
                            <Field label="OpenAI image model"><Input value={form.data.openai_image_model} onChange={set('openai_image_model')} placeholder="dall-e-3"/></Field>

                            <div className="sm:col-span-2"><Field label="Anthropic API key"><Secret configured={configured.anthropic} value={form.data.anthropic_api_key} onChange={set('anthropic_api_key')} placeholder="sk-ant-..."/></Field></div>
                            <Field label="Anthropic model"><Input value={form.data.anthropic_text_model} onChange={set('anthropic_text_model')} placeholder="claude-sonnet-4-6"/></Field>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2 items-center">
                            <TestButton provider="openai" label="Test OpenAI"/>
                            <TestButton provider="anthropic" label="Test Anthropic"/>
                            <button disabled={form.processing} className="btn-brand text-sm ml-auto">Save AI Config</button>
                        </div>
                    </div>
                )}

                {tab === 'media' && (
                    <div className="card p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Voice & Video</h3>
                                <p className="text-gray-400 text-xs">TTS and video composition</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Voiceover (TTS) driver">
                                <select value={form.data.tts_driver || 'elevenlabs'} onChange={(e) => form.setData('tts_driver', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="elevenlabs">ElevenLabs</option>
                                    <option value="openai">OpenAI TTS</option>
                                </select>
                            </Field>
                            <Field label="ElevenLabs voice id"><Input value={form.data.elevenlabs_voice_id} onChange={set('elevenlabs_voice_id')}/></Field>
                            <div className="sm:col-span-2"><Field label="ElevenLabs API key"><Secret configured={configured.elevenlabs} value={form.data.elevenlabs_api_key} onChange={set('elevenlabs_api_key')}/></Field></div>

                            <Field label="Video driver">
                                <select value={form.data.video_driver || 'ffmpeg'} onChange={(e) => form.setData('video_driver', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="ffmpeg">FFmpeg slideshow (local, free)</option>
                                    <option value="heygen">HeyGen avatar</option>
                                </select>
                            </Field>
                            {form.data.video_driver === 'heygen' && <>
                                <div className="sm:col-span-2"><Field label="HeyGen API key"><Secret configured={configured.heygen} value={form.data.heygen_api_key} onChange={set('heygen_api_key')}/></Field></div>
                                <Field label="Avatar ID"><Input value={form.data.heygen_avatar_id} onChange={set('heygen_avatar_id')}/></Field>
                                <Field label="Voice ID"><Input value={form.data.heygen_voice_id} onChange={set('heygen_voice_id')}/></Field>
                            </>}
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2 items-center">
                            <TestButton provider="elevenlabs" label="Test ElevenLabs"/>
                            <button disabled={form.processing} className="btn-brand text-sm ml-auto">Save Voice & Video</button>
                        </div>
                    </div>
                )}

                {tab === 'sched' && (
                    <div className="card p-6 space-y-5">
                        <h3 className="font-semibold text-gray-800">Scheduler</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="Timezone"><Input value={form.data.timezone} onChange={set('timezone')} placeholder="Asia/Karachi"/></Field>
                            <Field label="Default publish hour (0-23)">
                                <Input type="number" min="0" max="23" value={form.data.publish_hour} onChange={(v) => form.setData('publish_hour', Number(v))}/>
                            </Field>
                            <Field label="Default publish minute (0-59)">
                                <Input type="number" min="0" max="59" value={form.data.publish_minute} onChange={(v) => form.setData('publish_minute', Number(v))}/>
                            </Field>
                        </div>
                        <div className="flex justify-end"><button disabled={form.processing} className="btn-brand text-sm">Save Scheduler</button></div>
                    </div>
                )}

                {tab === 'notif' && (
                    <div className="card p-6 space-y-3">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        <label className="flex items-center gap-2 text-sm text-gray-700 p-3 rounded-xl border border-gray-100">
                            <input type="checkbox" checked={!!form.data.notif_email_on_publish} onChange={(e) => form.setData('notif_email_on_publish', e.target.checked)} className="rounded accent-brand"/>
                            Email me when a scheduled post is published
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 p-3 rounded-xl border border-gray-100">
                            <input type="checkbox" checked={!!form.data.notif_email_on_failure} onChange={(e) => form.setData('notif_email_on_failure', e.target.checked)} className="rounded accent-brand"/>
                            Email me when something fails
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 p-3 rounded-xl border border-gray-100">
                            <input type="checkbox" checked={!!form.data.notif_in_app} onChange={(e) => form.setData('notif_in_app', e.target.checked)} className="rounded accent-brand"/>
                            Show in-app notifications
                        </label>
                        <div className="flex justify-end pt-2"><button disabled={form.processing} className="btn-brand text-sm">Save Notifications</button></div>
                    </div>
                )}
            </form>
        </AuthenticatedLayout>
    );
}
