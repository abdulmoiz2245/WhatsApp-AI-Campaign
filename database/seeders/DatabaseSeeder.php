<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Segment;
use App\Models\User;
use App\Models\UserSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'demo@local.test'],
            ['name' => 'Demo User', 'password' => Hash::make('password')]
        );

        UserSetting::firstOrCreate(['user_id' => $user->id]);

        $vip = Segment::firstOrCreate(['user_id' => $user->id, 'name' => 'VIP'], ['color' => '#7c3aed']);
        $news = Segment::firstOrCreate(['user_id' => $user->id, 'name' => 'Newsletter'], ['color' => '#10b981']);

        $contacts = Contact::factory()->count(25)->create(['user_id' => $user->id]);
        $contacts->take(10)->each(fn ($c) => $c->segments()->syncWithoutDetaching([$vip->id]));
        $contacts->skip(10)->each(fn ($c) => $c->segments()->syncWithoutDetaching([$news->id]));

        $campaigns = collect([
            ['name' => 'Spring Promo', 'type' => 'promotional', 'status' => Campaign::STATUS_ACTIVE,
             'segment_id' => $vip->id, 'message_body' => 'Hi {{first_name}}, our spring sale is on!',
             'total_recipients' => 10, 'sent_count' => 8, 'delivered_count' => 7, 'read_count' => 4],
            ['name' => 'Welcome Drip', 'type' => 'drip', 'status' => Campaign::STATUS_DRAFT,
             'message_body' => 'Welcome aboard, {{first_name}}!'],
            ['name' => 'Holiday Broadcast', 'type' => 'broadcast', 'status' => Campaign::STATUS_SCHEDULED,
             'scheduled_at' => now()->addDay(), 'message_body' => 'Happy holidays from us!'],
        ])->map(fn ($c) => Campaign::create([...$c, 'user_id' => $user->id]));

        $active = $campaigns->first();
        foreach ($contacts->take(8) as $contact) {
            Message::create([
                'user_id' => $user->id,
                'campaign_id' => $active->id,
                'contact_id' => $contact->id,
                'direction' => 'outbound',
                'to_phone' => $contact->phone,
                'provider' => 'meta',
                'type' => 'text',
                'body' => 'Hi ' . $contact->name . ', our spring sale is on!',
                'status' => Message::STATUS_DELIVERED,
                'sent_at' => now()->subHours(2),
                'delivered_at' => now()->subHours(2)->addMinutes(1),
            ]);
        }
    }
}
