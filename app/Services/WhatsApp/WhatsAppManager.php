<?php

namespace App\Services\WhatsApp;

use App\Models\User;
use App\Services\WhatsApp\Contracts\WhatsAppDriver;
use InvalidArgumentException;

class WhatsAppManager
{
    /**
     * Resolve a driver for a given user (using their saved settings),
     * falling back to global config when user-level config is missing.
     */
    public function for(User $user): WhatsAppDriver
    {
        $s = $user->effectiveSettings();
        $driver = $s->whatsapp_driver ?: config('services.whatsapp.driver', 'meta');

        return match ($driver) {
            'meta' => new MetaCloudDriver(
                phoneNumberId: $s->meta_phone_number_id ?: (string) config('services.whatsapp.meta.phone_number_id'),
                accessToken: $s->meta_access_token ?: (string) config('services.whatsapp.meta.access_token'),
                verifyToken: $s->meta_verify_token ?: (string) config('services.whatsapp.meta.verify_token'),
                apiVersion: (string) config('services.whatsapp.meta.api_version', 'v21.0'),
            ),
            'twilio' => new TwilioWhatsAppDriver(
                sid: $s->twilio_account_sid ?: (string) config('services.whatsapp.twilio.sid'),
                token: $s->twilio_auth_token ?: (string) config('services.whatsapp.twilio.token'),
                from: $s->twilio_whatsapp_from ?: (string) config('services.whatsapp.twilio.from'),
            ),
            default => throw new InvalidArgumentException("Unknown WhatsApp driver: {$driver}"),
        };
    }

    /**
     * Resolve the default driver from global config (for unauthenticated webhook ingest).
     */
    public function default(): WhatsAppDriver
    {
        $driver = config('services.whatsapp.driver', 'meta');
        return match ($driver) {
            'meta' => new MetaCloudDriver(
                phoneNumberId: (string) config('services.whatsapp.meta.phone_number_id'),
                accessToken: (string) config('services.whatsapp.meta.access_token'),
                verifyToken: (string) config('services.whatsapp.meta.verify_token'),
                apiVersion: (string) config('services.whatsapp.meta.api_version', 'v21.0'),
            ),
            'twilio' => new TwilioWhatsAppDriver(
                sid: (string) config('services.whatsapp.twilio.sid'),
                token: (string) config('services.whatsapp.twilio.token'),
                from: (string) config('services.whatsapp.twilio.from'),
            ),
            default => throw new InvalidArgumentException("Unknown WhatsApp driver: {$driver}"),
        };
    }
}
