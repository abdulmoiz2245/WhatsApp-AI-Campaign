<?php

namespace Database\Factories;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContactFactory extends Factory
{
    protected $model = Contact::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->name(),
            'phone' => '+1' . $this->faker->numerify('##########'),
            'email' => $this->faker->safeEmail(),
            'country' => $this->faker->country(),
            'language' => 'en',
            'status' => 'active',
        ];
    }
}
