<?php

use App\Models\Campaign;
use App\Models\Contact;
use App\Models\Message;
use App\Models\User;

it('updates message status from a Meta webhook', function () {
    config()->set('services.whatsapp.driver', 'meta');
    config()->set('services.whatsapp.meta.verify_token', 'v');

    $user = User::factory()->create();
    $contact = Contact::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id]);

    $msg = Message::create([
        'user_id' => $user->id,
        'campaign_id' => $campaign->id,
        'contact_id' => $contact->id,
        'direction' => 'outbound',
        'to_phone' => $contact->phone,
        'provider' => 'meta',
        'provider_message_id' => 'wamid.TEST',
        'type' => 'text',
        'body' => 'hi',
        'status' => Message::STATUS_SENT,
    ]);

    $payload = ['entry' => [['changes' => [['value' => [
        'statuses' => [['id' => 'wamid.TEST', 'status' => 'delivered', 'recipient_id' => $contact->phone, 'timestamp' => '1700000000']],
    ]]]]]];

    $this->postJson('/api/webhooks/whatsapp', $payload)->assertOk();

    expect($msg->fresh()->status)->toBe(Message::STATUS_DELIVERED);
    expect($campaign->fresh()->delivered_count)->toBe(1);
});

it('verifies meta webhook subscription challenge', function () {
    config()->set('services.whatsapp.driver', 'meta');
    config()->set('services.whatsapp.meta.verify_token', 'shhh');

    $this->get('/api/webhooks/whatsapp?hub_mode=subscribe&hub_verify_token=shhh&hub_challenge=42')
        ->assertOk()
        ->assertSee('42');
});
