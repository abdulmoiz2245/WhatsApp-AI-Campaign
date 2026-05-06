import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const TABS = ['WhatsApp', 'AI', 'Voice & Video', 'Scheduler', 'Notifications'];

const Field = ({ label, children, hint }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
        {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
);

const Input = ({ value, onChange, type = 'text', placeholder, ...rest }) => (
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
           className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" {...rest} />
);

const Secret = ({ configured, value, onChange, placeholder }) => (
    <div className="flex items-center gap-2">
        <input type="password" value={value || ''} onChange={(e) => onChange(e.target.value)}
               placeholder={configured ? '••••••••  (saved — leave blank to keep)' : (placeholder || 'sk-...')}
               className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"/>
        <span className={`text-xs px-2 py-0.5 rounded-full ${configured ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {configured ? 'configured' : 'not set'}
        </span>
    </div>
);

export default function SettingsIndex({ settings, configured, webhook_url }) {
    const [tab, setTab] = useState('WhatsApp');
    const form = useForm({
        ...settings,
        meta_access_token: '', twilio_auth_token: '', openai_api_key: '',
        anthropic_api_key: '', elevenlabs_api_key: '', heygen_api_key: '',
    });

    const submit = (e) => { e.preventDefault(); form.patch(route('settings.update'), { preserveScroll: true }); };
    const set = (k) => (v) => form.setData(k, v);

    return (
        <AuthenticatedLayout header={
            <div>
                <h2 className="text-xl font-bold text-gray-800">Settings</h2>
                <p className="text-gray-400 text-sm">Configure providers, scheduling, and notifications.</p>
            </div>
        }>
            <Head title="Settings" />

            <div className="bg-white rounded-2xl border border-gray-100">
                <div className="border-b border-gray-100 px-2 flex gap-1 overflow-x-auto">
                    {TABS.map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                                    tab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                <form onSubmit={submit} className="p-6 space-y-5">
                    {tab === 'WhatsApp' && (
                        <>
                            <Field label="Driver">
                                <select value={form.data.whatsapp_driver || 'meta'} onChange={(e) => form.setData('whatsapp_driver', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="meta">Meta Cloud API (official)</option>
                                    <option value="twilio">Twilio</option>
                                </select>
                            </Field>

                            <Field label="Webhook URL" hint="Use this in your provider's webhook settings.">
                                <Input value={webhook_url} onChange={() => {}} readOnly />
                            </Field>

                            {form.data.whatsapp_driver === 'meta' && (
                                <>
                                    <Field label="Phone Number ID"><Input value={form.data.meta_phone_number_id} onChange={set('meta_phone_number_id')}/></Field>
                                    <Field label="Business Account ID"><Input value={form.data.meta_business_account_id} onChange={set('meta_business_account_id')}/></Field>
                                    <Field label="Access Token"><Secret configured={configured.meta} value={form.data.meta_access_token} onChange={set('meta_access_token')}/></Field>
                                    <Field label="Webhook verify token"><Input value={form.data.meta_verify_token} onChange={set('meta_verify_token')}/></Field>
                                </>
                            )}
                            {form.data.whatsapp_driver === 'twilio' && (
                                <>
                                    <Field label="Account SID"><Input value={form.data.twilio_account_sid} onChange={set('twilio_account_sid')}/></Field>
                                    <Field label="Auth Token"><Secret configured={configured.twilio} value={form.data.twilio_auth_token} onChange={set('twilio_auth_token')}/></Field>
                                    <Field label="From (whatsapp:+...)"><Input value={form.data.twilio_whatsapp_from} onChange={set('twilio_whatsapp_from')}/></Field>
                                </>
                            )}
                        </>
                    )}

                    {tab === 'AI' && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Text driver">
                                    <select value={form.data.ai_text_driver || 'openai'} onChange={(e) => form.setData('ai_text_driver', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic</option>
                                    </select>
                                </Field>
                                <Field label="Image driver">
                                    <select value={form.data.ai_image_driver || 'openai'} onChange={(e) => form.setData('ai_image_driver', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                        <option value="openai">OpenAI (DALL-E)</option>
                                    </select>
                                </Field>
                            </div>

                            <Field label="OpenAI API key"><Secret configured={configured.openai} value={form.data.openai_api_key} onChange={set('openai_api_key')}/></Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="OpenAI text model"><Input value={form.data.openai_text_model} onChange={set('openai_text_model')} placeholder="gpt-4o-mini"/></Field>
                                <Field label="OpenAI image model"><Input value={form.data.openai_image_model} onChange={set('openai_image_model')} placeholder="dall-e-3"/></Field>
                            </div>

                            <Field label="Anthropic API key"><Secret configured={configured.anthropic} value={form.data.anthropic_api_key} onChange={set('anthropic_api_key')}/></Field>
                            <Field label="Anthropic model"><Input value={form.data.anthropic_text_model} onChange={set('anthropic_text_model')} placeholder="claude-sonnet-4-6"/></Field>
                        </>
                    )}

                    {tab === 'Voice & Video' && (
                        <>
                            <Field label="Voiceover (TTS) driver">
                                <select value={form.data.tts_driver || 'elevenlabs'} onChange={(e) => form.setData('tts_driver', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="elevenlabs">ElevenLabs</option>
                                    <option value="openai">OpenAI TTS</option>
                                </select>
                            </Field>
                            <Field label="ElevenLabs API key"><Secret configured={configured.elevenlabs} value={form.data.elevenlabs_api_key} onChange={set('elevenlabs_api_key')}/></Field>
                            <Field label="ElevenLabs voice id"><Input value={form.data.elevenlabs_voice_id} onChange={set('elevenlabs_voice_id')}/></Field>

                            <hr className="border-gray-100"/>

                            <Field label="Video driver">
                                <select value={form.data.video_driver || 'ffmpeg'} onChange={(e) => form.setData('video_driver', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50">
                                    <option value="ffmpeg">FFmpeg slideshow (local, free)</option>
                                    <option value="heygen">HeyGen avatar</option>
                                </select>
                            </Field>
                            {form.data.video_driver === 'heygen' && (
                                <>
                                    <Field label="HeyGen API key"><Secret configured={configured.heygen} value={form.data.heygen_api_key} onChange={set('heygen_api_key')}/></Field>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Avatar ID"><Input value={form.data.heygen_avatar_id} onChange={set('heygen_avatar_id')}/></Field>
                                        <Field label="Voice ID"><Input value={form.data.heygen_voice_id} onChange={set('heygen_voice_id')}/></Field>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {tab === 'Scheduler' && (
                        <>
                            <Field label="Timezone"><Input value={form.data.timezone} onChange={set('timezone')} placeholder="Asia/Karachi"/></Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Default publish hour (0-23)">
                                    <Input type="number" min="0" max="23" value={form.data.publish_hour} onChange={(v) => form.setData('publish_hour', Number(v))}/>
                                </Field>
                                <Field label="Default publish minute (0-59)">
                                    <Input type="number" min="0" max="59" value={form.data.publish_minute} onChange={(v) => form.setData('publish_minute', Number(v))}/>
                                </Field>
                            </div>
                        </>
                    )}

                    {tab === 'Notifications' && (
                        <>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={!!form.data.notif_email_on_publish} onChange={(e) => form.setData('notif_email_on_publish', e.target.checked)}/>
                                Email me when a scheduled post is published
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={!!form.data.notif_email_on_failure} onChange={(e) => form.setData('notif_email_on_failure', e.target.checked)}/>
                                Email me when something fails
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={!!form.data.notif_in_app} onChange={(e) => form.setData('notif_in_app', e.target.checked)}/>
                                Show in-app notifications
                            </label>
                        </>
                    )}

                    <div className="pt-2 flex justify-end">
                        <button disabled={form.processing}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
                            {form.processing ? 'Saving…' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
