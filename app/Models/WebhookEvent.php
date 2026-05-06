<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEvent extends Model
{
    protected $fillable = [
        'provider', 'event_type', 'external_id', 'payload',
        'processed', 'processed_at', 'error',
    ];

    protected $casts = [
        'payload' => 'array',
        'error' => 'array',
        'processed' => 'boolean',
        'processed_at' => 'datetime',
    ];
}
