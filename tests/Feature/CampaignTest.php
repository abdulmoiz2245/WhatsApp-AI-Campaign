<?php

use App\Jobs\DispatchCampaignJob;
use App\Models\Campaign;
use App\Models\Contact;
use App\Models\Segment;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

it('lists user campaigns', function () {
    $user = User::factory()->create();
    Campaign::factory()->count(3)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get('/campaigns')
        ->assertOk()
        ->assertInertia(fn ($p) => $p->component('Campaigns/Index')->has('campaigns.data', 3));
});

it('creates a campaign', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => 'Holiday Sale',
            'type' => 'promotional',
            'message_body' => 'Hi there',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('campaigns', ['name' => 'Holiday Sale', 'user_id' => $user->id]);
});

it('dispatches a campaign as queued jobs', function () {
    Queue::fake();

    $user = User::factory()->create();
    $segment = Segment::factory()->create(['user_id' => $user->id]);
    $contacts = Contact::factory()->count(3)->create(['user_id' => $user->id, 'status' => 'active']);
    $contacts->each(fn ($c) => $c->segments()->attach($segment));
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'segment_id' => $segment->id,
        'status' => Campaign::STATUS_DRAFT,
    ]);

    $this->actingAs($user)
        ->post(route('campaigns.start', $campaign))
        ->assertRedirect();

    Queue::assertPushed(DispatchCampaignJob::class, fn ($j) => $j->campaignId === $campaign->id);
});

it('blocks access to other users campaigns', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $campaign = Campaign::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($intruder)
        ->delete(route('campaigns.destroy', $campaign))
        ->assertForbidden();
});
