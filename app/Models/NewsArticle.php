<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'source', 'source_url', 'language', 'category', 'region',
        'title', 'summary', 'image_url', 'external_id',
        'published_at', 'trending',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'trending' => 'boolean',
    ];

    public function researchTopics(): HasMany
    {
        return $this->hasMany(ResearchTopic::class);
    }
}
