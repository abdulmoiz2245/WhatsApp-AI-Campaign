<?php

use App\Models\User;

it('renders settings page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings')
        ->assertOk()
        ->assertInertia(fn ($p) => $p->component('Settings/Index')
            ->has('settings')
            ->has('configured')
            ->has('webhook_url'));
});

it('saves settings without overwriting unchanged secrets', function () {
    $user = User::factory()->create();

    // First save: with API key
    $this->actingAs($user)->patch('/settings', [
        'whatsapp_driver' => 'meta',
        'meta_access_token' => 'secret-token-1',
        'timezone' => 'Asia/Karachi',
    ])->assertRedirect();

    expect($user->refresh()->effectiveSettings()->meta_access_token)->toBe('secret-token-1');

    // Second save: blank token should keep the old one
    $this->actingAs($user)->patch('/settings', [
        'whatsapp_driver' => 'meta',
        'meta_access_token' => '',
        'timezone' => 'UTC',
    ])->assertRedirect();

    $u = $user->fresh();
    expect($u->effectiveSettings()->meta_access_token)->toBe('secret-token-1');
    expect($u->effectiveSettings()->timezone)->toBe('UTC');
});
