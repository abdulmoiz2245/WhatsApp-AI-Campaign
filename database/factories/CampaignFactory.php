<?php

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CampaignFactory extends Factory
{
    protected $model = Campaign::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->catchPhrase(),
            'type' => $this->faker->randomElement(['promotional', 'transactional', 'broadcast', 'drip']),
            'status' => Campaign::STATUS_DRAFT,
            'message_body' => 'Hi {{first_name}}, ' . $this->faker->sentence(),
        ];
    }
}
