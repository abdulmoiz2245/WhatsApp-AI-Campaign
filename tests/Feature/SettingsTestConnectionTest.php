<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

it('tests the OpenAI connection successfully', function () {
    Http::fake([
        'api.openai.com/*' => Http::response(['data' => [['id' => 'gpt-4o']]], 200),
    ]);

    $user = User::factory()->create();
    $user->effectiveSettings()->update(['openai_api_key' => 'sk-fake']);

    $this->actingAs($user)
        ->postJson(route('settings.test'), ['provider' => 'openai'])
        ->assertOk()
        ->assertJson(['ok' => true]);
});

it('returns failure when OpenAI key is missing', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('settings.test'), ['provider' => 'openai'])
        ->assertStatus(422)
        ->assertJson(['ok' => false]);
});

it('tests the Meta WhatsApp connection successfully', function () {
    Http::fake([
        'graph.facebook.com/*' => Http::response(['display_phone_number' => '+92 300 1234567', 'verified_name' => 'WA AI'], 200),
    ]);

    $user = User::factory()->create();
    $user->effectiveSettings()->update([
        'whatsapp_driver' => 'meta',
        'meta_phone_number_id' => 'PH',
        'meta_access_token' => 'TOK',
    ]);

    $this->actingAs($user)
        ->postJson(route('settings.test'), ['provider' => 'whatsapp'])
        ->assertOk()
        ->assertJson(['ok' => true]);
});
