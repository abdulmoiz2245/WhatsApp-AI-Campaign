<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $s = $request->user()->effectiveSettings();

        // Mask secrets — UI shows boolean "configured" indicators only.
        $configured = [
            'meta' => (bool) $s->meta_access_token,
            'twilio' => (bool) $s->twilio_auth_token,
            'openai' => (bool) $s->openai_api_key,
            'anthropic' => (bool) $s->anthropic_api_key,
            'elevenlabs' => (bool) $s->elevenlabs_api_key,
            'heygen' => (bool) $s->heygen_api_key,
        ];

        return Inertia::render('Settings/Index', [
            'settings' => $s->only([
                'whatsapp_driver', 'meta_phone_number_id', 'meta_business_account_id',
                'meta_verify_token', 'twilio_account_sid', 'twilio_whatsapp_from',
                'ai_text_driver', 'ai_image_driver', 'openai_text_model', 'openai_image_model',
                'anthropic_text_model', 'tts_driver', 'elevenlabs_voice_id', 'video_driver',
                'heygen_avatar_id', 'heygen_voice_id', 'timezone', 'publish_hour',
                'publish_minute', 'notif_email_on_publish', 'notif_email_on_failure',
                'notif_in_app',
            ]),
            'configured' => $configured,
            'webhook_url' => url('/api/webhooks/whatsapp'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'whatsapp_driver' => ['nullable', Rule::in(['meta', 'twilio'])],
            'meta_phone_number_id' => ['nullable', 'string', 'max:64'],
            'meta_business_account_id' => ['nullable', 'string', 'max:64'],
            'meta_access_token' => ['nullable', 'string'],
            'meta_verify_token' => ['nullable', 'string', 'max:120'],
            'twilio_account_sid' => ['nullable', 'string', 'max:64'],
            'twilio_auth_token' => ['nullable', 'string'],
            'twilio_whatsapp_from' => ['nullable', 'string', 'max:64'],

            'ai_text_driver' => ['nullable', Rule::in(['openai', 'anthropic'])],
            'ai_image_driver' => ['nullable', Rule::in(['openai'])],
            'openai_api_key' => ['nullable', 'string'],
            'openai_text_model' => ['nullable', 'string', 'max:64'],
            'openai_image_model' => ['nullable', 'string', 'max:64'],
            'anthropic_api_key' => ['nullable', 'string'],
            'anthropic_text_model' => ['nullable', 'string', 'max:64'],

            'tts_driver' => ['nullable', Rule::in(['elevenlabs', 'openai'])],
            'elevenlabs_api_key' => ['nullable', 'string'],
            'elevenlabs_voice_id' => ['nullable', 'string', 'max:64'],

            'video_driver' => ['nullable', Rule::in(['ffmpeg', 'heygen'])],
            'heygen_api_key' => ['nullable', 'string'],
            'heygen_avatar_id' => ['nullable', 'string', 'max:64'],
            'heygen_voice_id' => ['nullable', 'string', 'max:64'],

            'timezone' => ['nullable', 'string', 'max:64'],
            'publish_hour' => ['nullable', 'integer', 'between:0,23'],
            'publish_minute' => ['nullable', 'integer', 'between:0,59'],

            'notif_email_on_publish' => ['nullable', 'boolean'],
            'notif_email_on_failure' => ['nullable', 'boolean'],
            'notif_in_app' => ['nullable', 'boolean'],
        ]);

        $s = $request->user()->effectiveSettings();
        // Don't overwrite secrets when the user submits the empty/masked field.
        foreach (['meta_access_token', 'twilio_auth_token', 'openai_api_key',
                  'anthropic_api_key', 'elevenlabs_api_key', 'heygen_api_key'] as $secret) {
            if (! ($data[$secret] ?? null)) {
                unset($data[$secret]);
            }
        }
        $s->update($data);

        return back()->with('success', 'Settings saved.');
    }
}
