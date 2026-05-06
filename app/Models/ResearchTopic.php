<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchTopic extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'topic', 'content_type', 'tone', 'language', 'status',
        'research_summary', 'script', 'outline', 'sources',
        'thumbnail_path', 'metadata', 'completed_at',
    ];

    protected $casts = [
        'outline' => 'array',
        'sources' => 'array',
        'metadata' => 'array',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
