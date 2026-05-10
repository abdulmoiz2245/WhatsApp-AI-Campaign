<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PipelineJob extends Model
{
    use HasFactory;

    public const STAGES = ['script', 'voiceover', 'video', 'thumbnail', 'upload', 'done'];

    protected $fillable = [
        'user_id', 'research_topic_id', 'campaign_id', 'title', 'status',
        'current_stage', 'progress', 'stages', 'script', 'voiceover_path',
        'voiceover_duration_ms', 'video_path', 'thumbnail_path',
        'whatsapp_media_id', 'error', 'enabled_stages', 'started_at', 'completed_at',
    ];

    protected $casts = [
        'stages' => 'array',
        'error' => 'array',
        'enabled_stages' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function stageEnabled(string $stage): bool
    {
        $flags = $this->enabled_stages ?? [];
        return $flags[$stage] ?? true;
    }

    public function stageCompleted(string $stage): bool
    {
        return in_array($this->stages[$stage]['status'] ?? null, ['completed', 'skipped'], true);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function researchTopic(): BelongsTo
    {
        return $this->belongsTo(ResearchTopic::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function markStage(string $stage, string $status, array $data = []): void
    {
        $stages = $this->stages ?? [];
        $stages[$stage] = array_merge(['status' => $status, 'at' => now()->toIso8601String()], $data);
        $this->stages = $stages;
        $this->current_stage = $stage;

        $idx = array_search($stage, self::STAGES, true);
        if ($idx !== false && in_array($status, ['completed', 'skipped'], true)) {
            $next = self::STAGES[$idx + 1] ?? 'done';
            $this->current_stage = $next;
            $this->progress = (int) round((($idx + 1) / (count(self::STAGES) - 1)) * 100);
        }
        $this->save();
    }
}
