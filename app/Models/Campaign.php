<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAUSED = 'paused';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id', 'name', 'type', 'status', 'segment_id', 'template_id',
        'message_body', 'media_url', 'media_type', 'scheduled_at',
        'started_at', 'completed_at', 'total_recipients',
        'sent_count', 'delivered_count', 'read_count', 'failed_count',
        'replied_count', 'settings',
    ];

    protected $casts = [
        'settings' => 'array',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function segment(): BelongsTo
    {
        return $this->belongsTo(Segment::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(MessageTemplate::class, 'template_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function progressPercent(): int
    {
        if (! $this->total_recipients) {
            return 0;
        }
        return (int) min(100, round(($this->sent_count / $this->total_recipients) * 100));
    }
}
