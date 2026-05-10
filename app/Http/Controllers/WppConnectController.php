<?php

namespace App\Http\Controllers;

use App\Services\WhatsApp\WhatsAppManager;
use App\Services\WhatsApp\WppConnectDriver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class WppConnectController extends Controller
{
    public function page(Request $request): Response
    {
        $s = $request->user()->effectiveSettings();

        return Inertia::render('Settings/WppConnect', [
            'session' => $s->wppconnect_session ?: config('services.whatsapp.wppconnect.session'),
            'baseUrl' => $s->wppconnect_base_url ?: config('services.whatsapp.wppconnect.base_url'),
            'webhook_url' => url('/api/webhooks/whatsapp'),
        ]);
    }

    public function status(Request $request, WhatsAppManager $manager): JsonResponse
    {
        $driver = $this->driverFor($request, $manager);
        try {
            return response()->json($driver->status());
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function start(Request $request, WhatsAppManager $manager): JsonResponse
    {
        $driver = $this->driverFor($request, $manager);
        try {
            $webhook = url('/api/webhooks/whatsapp');
            return response()->json($driver->startSession($webhook));
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function qr(Request $request, WhatsAppManager $manager): JsonResponse
    {
        $driver = $this->driverFor($request, $manager);
        try {
            return response()->json([
                'qrcode' => $driver->qrCode(),
                'status' => $driver->status(),
            ]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function logout(Request $request, WhatsAppManager $manager): JsonResponse
    {
        $driver = $this->driverFor($request, $manager);
        try {
            return response()->json($driver->logout());
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 500);
        }
    }

    protected function driverFor(Request $request, WhatsAppManager $manager): WppConnectDriver
    {
        // Force-resolve wppconnect regardless of user's primary driver.
        $s = $request->user()->effectiveSettings();
        return new WppConnectDriver(
            baseUrl: $s->wppconnect_base_url ?: (string) config('services.whatsapp.wppconnect.base_url'),
            secret: $s->wppconnect_secret ?: (string) config('services.whatsapp.wppconnect.secret'),
            session: $s->wppconnect_session ?: (string) config('services.whatsapp.wppconnect.session'),
            webhookSecret: $s->wppconnect_webhook_secret ?: config('services.whatsapp.wppconnect.webhook_secret'),
        );
    }
}
