<?php

namespace App\Http\Controllers;

use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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

    /**
     * Verify the user's currently saved credentials by hitting a cheap
     * read endpoint on each provider. Returns per-provider ok/error JSON.
     */
    public function testConnection(Request $request, WhatsAppManager $waManager): JsonResponse
    {
        $request->validate([
            'provider' => ['required', Rule::in(['whatsapp', 'openai', 'anthropic', 'elevenlabs'])],
        ]);

        $user = $request->user();
        $s = $user->effectiveSettings();

        try {
            switch ($request->provider) {
                case 'whatsapp':
                    $driver = $waManager->for($user);
                    if ($driver->name() === 'meta') {
                        $token = $s->meta_access_token ?: (string) config('services.whatsapp.meta.access_token');
                        $phoneId = $s->meta_phone_number_id ?: (string) config('services.whatsapp.meta.phone_number_id');
                        $version = (string) config('services.whatsapp.meta.api_version', 'v21.0');
                        if (! $token || ! $phoneId) {
                            return response()->json(['ok' => false, 'message' => 'Missing access token or phone number ID.'], 422);
                        }
                        $resp = Http::withToken($token)->acceptJson()->timeout(15)
                            ->get("https://graph.facebook.com/{$version}/{$phoneId}");
                        if (! $resp->successful()) {
                            return response()->json(['ok' => false, 'message' => $resp->json('error.message') ?? 'Meta API rejected the request.'], 422);
                        }
                        return response()->json(['ok' => true, 'message' => 'Connected to WhatsApp via Meta.', 'detail' => $resp->json('display_phone_number') ?? $resp->json('verified_name')]);
                    }
                    if ($driver->name() === 'twilio') {
                        $sid = $s->twilio_account_sid ?: (string) config('services.whatsapp.twilio.sid');
                        $token = $s->twilio_auth_token ?: (string) config('services.whatsapp.twilio.token');
                        if (! $sid || ! $token) {
                            return response()->json(['ok' => false, 'message' => 'Missing Twilio SID or auth token.'], 422);
                        }
                        $resp = Http::withBasicAuth($sid, $token)->acceptJson()->timeout(15)
                            ->get("https://api.twilio.com/2010-04-01/Accounts/{$sid}.json");
                        if (! $resp->successful()) {
                            return response()->json(['ok' => false, 'message' => 'Twilio rejected the credentials.'], 422);
                        }
                        return response()->json(['ok' => true, 'message' => 'Connected to Twilio.', 'detail' => $resp->json('friendly_name')]);
                    }
                    return response()->json(['ok' => false, 'message' => 'Unknown WhatsApp driver.'], 422);

                case 'openai':
                    $key = $s->openai_api_key ?: (string) config('services.openai.key');
                    if (! $key) return response()->json(['ok' => false, 'message' => 'No OpenAI API key set.'], 422);
                    $resp = Http::withToken($key)->acceptJson()->timeout(15)->get('https://api.openai.com/v1/models');
                    if (! $resp->successful()) {
                        return response()->json(['ok' => false, 'message' => $resp->json('error.message') ?? 'OpenAI rejected the request.'], 422);
                    }
                    return response()->json(['ok' => true, 'message' => 'OpenAI key is valid.']);

                case 'anthropic':
                    $key = $s->anthropic_api_key ?: (string) config('services.anthropic.key');
                    if (! $key) return response()->json(['ok' => false, 'message' => 'No Anthropic API key set.'], 422);
                    // Cheap canary call.
                    $resp = Http::withHeaders([
                            'x-api-key' => $key,
                            'anthropic-version' => '2023-06-01',
                        ])->acceptJson()->timeout(15)
                        ->post('https://api.anthropic.com/v1/messages', [
                            'model' => $s->anthropic_text_model ?: (string) config('services.anthropic.text_model'),
                            'max_tokens' => 8,
                            'messages' => [['role' => 'user', 'content' => 'ping']],
                        ]);
                    if (! $resp->successful()) {
                        return response()->json(['ok' => false, 'message' => $resp->json('error.message') ?? 'Anthropic rejected the request.'], 422);
                    }
                    return response()->json(['ok' => true, 'message' => 'Anthropic key is valid.']);

                case 'elevenlabs':
                    $key = $s->elevenlabs_api_key ?: (string) config('services.elevenlabs.key');
                    if (! $key) return response()->json(['ok' => false, 'message' => 'No ElevenLabs API key set.'], 422);
                    $resp = Http::withHeaders(['xi-api-key' => $key])->acceptJson()->timeout(15)
                        ->get('https://api.elevenlabs.io/v1/user/subscription');
                    if (! $resp->successful()) {
                        return response()->json(['ok' => false, 'message' => 'ElevenLabs rejected the credentials.'], 422);
                    }
                    return response()->json(['ok' => true, 'message' => 'ElevenLabs key is valid.', 'detail' => $resp->json('tier')]);
            }
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 500);
        }

        return response()->json(['ok' => false, 'message' => 'Unsupported provider.'], 422);
    }
}
