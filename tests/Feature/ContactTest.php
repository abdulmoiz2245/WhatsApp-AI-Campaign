<?php

use App\Models\Contact;
use App\Models\User;
use Illuminate\Http\UploadedFile;

it('imports contacts from CSV', function () {
    $user = User::factory()->create();

    $csv = "name,phone,email\nAlice,+15550001,alice@a.com\nBob,+15550002,bob@b.com\n";
    $file = UploadedFile::fake()->createWithContent('contacts.csv', $csv);

    $this->actingAs($user)
        ->post(route('contacts.import'), ['file' => $file])
        ->assertRedirect();

    expect(Contact::where('user_id', $user->id)->count())->toBe(2);
    $this->assertDatabaseHas('contacts', ['phone' => '+15550001', 'name' => 'Alice']);
});

it('creates a contact', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('contacts.store'), [
            'name' => 'Charlie', 'phone' => '+15550003',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('contacts', ['phone' => '+15550003', 'user_id' => $user->id]);
});
