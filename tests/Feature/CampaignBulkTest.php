<?php

use App\Models\Campaign;
use App\Models\User;

it('bulk pauses active campaigns', function () {
    $user = User::factory()->create();
    $a = Campaign::factory()->create(['user_id' => $user->id, 'status' => Campaign::STATUS_ACTIVE]);
    $b = Campaign::factory()->create(['user_id' => $user->id, 'status' => Campaign::STATUS_ACTIVE]);

    $this->actingAs($user)
        ->post(route('campaigns.bulk'), ['action' => 'pause', 'ids' => [$a->id, $b->id]])
        ->assertRedirect();

    expect($a->fresh()->status)->toBe(Campaign::STATUS_PAUSED);
    expect($b->fresh()->status)->toBe(Campaign::STATUS_PAUSED);
});

it('bulk deletes campaigns', function () {
    $user = User::factory()->create();
    $ids = Campaign::factory()->count(3)->create(['user_id' => $user->id])->pluck('id')->all();

    $this->actingAs($user)
        ->post(route('campaigns.bulk'), ['action' => 'delete', 'ids' => $ids])
        ->assertRedirect();

    expect(Campaign::whereIn('id', $ids)->count())->toBe(0);
});

it('bulk action only touches the users own campaigns', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $own = Campaign::factory()->create(['user_id' => $owner->id, 'status' => Campaign::STATUS_ACTIVE]);
    $other = Campaign::factory()->create(['user_id' => $intruder->id, 'status' => Campaign::STATUS_ACTIVE]);

    $this->actingAs($owner)
        ->post(route('campaigns.bulk'), ['action' => 'pause', 'ids' => [$own->id, $other->id]])
        ->assertRedirect();

    expect($own->fresh()->status)->toBe(Campaign::STATUS_PAUSED);
    expect($other->fresh()->status)->toBe(Campaign::STATUS_ACTIVE);
});
