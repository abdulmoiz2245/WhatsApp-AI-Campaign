<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function settings(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    public function segments(): HasMany
    {
        return $this->hasMany(Segment::class);
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function templates(): HasMany
    {
        return $this->hasMany(MessageTemplate::class);
    }

    public function researchTopics(): HasMany
    {
        return $this->hasMany(ResearchTopic::class);
    }

    public function pipelineJobs(): HasMany
    {
        return $this->hasMany(PipelineJob::class);
    }

    public function scheduledPosts(): HasMany
    {
        return $this->hasMany(ScheduledPost::class);
    }

    public function effectiveSettings(): UserSetting
    {
        $existing = $this->settings()->first();
        if ($existing) {
            return $existing;
        }
        return $this->settings()->firstOrCreate(['user_id' => $this->id]);
    }
}
