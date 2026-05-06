<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $hidden = [
        'meta_access_token', 'twilio_auth_token', 'openai_api_key',
        'anthropic_api_key', 'elevenlabs_api_key', 'heygen_api_key',
    ];

    protected $casts = [
        'meta_access_token' => 'encrypted',
        'twilio_auth_token' => 'encrypted',
        'openai_api_key' => 'encrypted',
        'anthropic_api_key' => 'encrypted',
        'elevenlabs_api_key' => 'encrypted',
        'heygen_api_key' => 'encrypted',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
