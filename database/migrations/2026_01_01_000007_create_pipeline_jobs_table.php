<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pipeline_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('research_topic_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('status', 24)->default('queued'); // queued, running, completed, failed, cancelled
            $table->string('current_stage', 32)->default('script'); // script, voiceover, video, thumbnail, upload, done
            $table->unsignedTinyInteger('progress')->default(0); // 0-100
            $table->json('stages')->nullable(); // per-stage status & output paths
            $table->longText('script')->nullable();
            $table->string('voiceover_path')->nullable();
            $table->unsignedInteger('voiceover_duration_ms')->nullable();
            $table->string('video_path')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->string('whatsapp_media_id')->nullable();
            $table->json('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pipeline_jobs');
    }
};
