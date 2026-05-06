<?php

use App\Services\WhatsApp\MetaCloudDriver;
use App\Services\WhatsApp\TwilioWhatsAppDriver;
use Illuminate\Support\Facades\Http;

it('Meta driver sends a text message via the Graph API', function () {
    Http::fake([
        'graph.facebook.com/*' => Http::response([
            'messaging_product' => 'whatsapp',
            'messages' => [['id' => 'wamid.ABC']],
        ], 200),
    ]);

    $driver = new MetaCloudDriver('PHONE_ID', 'TOKEN', 'verify');
    $res = $driver->sendText('15550001', 'hello');

    expect($res['provider_message_id'])->toBe('wamid.ABC');
    Http::assertSent(fn ($req) => str_contains($req->url(), 'PHONE_ID/messages'));
});

it('Meta driver verifies webhook subscription challenge', function () {
    $driver = new MetaCloudDriver('id', 'token', 'verify-secret');
    $res = $driver->verifyWebhook(['hub_mode' => 'subscribe', 'hub_verify_token' => 'verify-secret', 'hub_challenge' => '12345'], null, '');
    expect($res)->toBe('12345');

    expect($driver->verifyWebhook(['hub_mode' => 'subscribe', 'hub_verify_token' => 'wrong'], null, ''))->toBeFalse();
});

it('Meta driver parses status webhook into normalized events', function () {
    $payload = [
        'entry' => [['changes' => [['value' => [
            'statuses' => [['id' => 'wamid.X', 'status' => 'delivered', 'recipient_id' => '15550009', 'timestamp' => '1700000000']],
        ]]]]],
    ];
    $driver = new MetaCloudDriver('id', 'token', 'v');
    $events = $driver->parseWebhook($payload)['events'];

    expect($events)->toHaveCount(1);
    expect($events[0]['type'])->toBe('status');
    expect($events[0]['status'])->toBe('delivered');
    expect($events[0]['provider_message_id'])->toBe('wamid.X');
});

it('Twilio driver sends a text message', function () {
    Http::fake([
        'api.twilio.com/*' => Http::response(['sid' => 'SM_123'], 201),
    ]);

    $driver = new TwilioWhatsAppDriver('AC_SID', 'AUTH', 'whatsapp:+14155238886');
    $res = $driver->sendText('+15550001', 'hi');

    expect($res['provider_message_id'])->toBe('SM_123');
});
