<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('pipeline_job_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->longText('caption')->nullable();
            $table->string('media_path')->nullable();
            $table->string('media_type', 24)->nullable();
            $table->date('scheduled_for');
            $table->time('scheduled_time');
            $table->string('timezone', 64)->default('Asia/Karachi');
            $table->string('status', 24)->default('scheduled'); // scheduled, publishing, published, failed, cancelled
            $table->boolean('auto_publish')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->json('result')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'scheduled_for']);
            $table->index(['status', 'scheduled_for']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_posts');
    }
};
