<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledPost extends Model
{
    use HasFactory;

    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_PUBLISHING = 'publishing';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'user_id', 'campaign_id', 'pipeline_job_id', 'title', 'caption',
        'media_path', 'media_type', 'scheduled_for', 'scheduled_time',
        'timezone', 'status', 'auto_publish', 'published_at', 'result',
    ];

    protected $casts = [
        'scheduled_for' => 'date',
        'auto_publish' => 'boolean',
        'published_at' => 'datetime',
        'result' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function pipelineJob(): BelongsTo
    {
        return $this->belongsTo(PipelineJob::class);
    }
}
