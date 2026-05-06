<?php

use App\Models\Contact;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Http;

it('shows the conversation page with messages', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['user_id' => $user->id]);
    Message::create([
        'user_id' => $user->id,
        'contact_id' => $contact->id,
        'direction' => 'outbound',
        'to_phone' => $contact->phone,
        'provider' => 'meta',
        'type' => 'text',
        'body' => 'hi',
        'status' => Message::STATUS_DELIVERED,
        'sent_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('contacts.show', $contact))
        ->assertOk()
        ->assertInertia(fn ($p) => $p->component('Contacts/Show')
            ->has('contact')
            ->has('messages', 1));
});

it('sends a text message to a contact', function () {
    Http::fake([
        'graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.X']]], 200),
    ]);
    config()->set('services.whatsapp.driver', 'meta');
    config()->set('services.whatsapp.meta.phone_number_id', 'PH');
    config()->set('services.whatsapp.meta.access_token', 'TOK');

    $user = User::factory()->create();
    $contact = Contact::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post(route('contacts.send', $contact), ['body' => 'salaam'])
        ->assertRedirect();

    $this->assertDatabaseHas('messages', [
        'user_id' => $user->id,
        'contact_id' => $contact->id,
        'direction' => 'outbound',
        'body' => 'salaam',
        'provider_message_id' => 'wamid.X',
    ]);
});

it('blocks viewing another users conversation', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $contact = Contact::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($intruder)
        ->get(route('contacts.show', $contact))
        ->assertForbidden();
});
