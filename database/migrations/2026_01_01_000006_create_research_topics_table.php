<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('topic');
            $table->string('content_type', 32)->default('script'); // script, blog, caption, ad
            $table->string('tone', 32)->default('professional');
            $table->string('language', 16)->default('en');
            $table->string('status', 24)->default('pending'); // pending, researching, completed, failed
            $table->longText('research_summary')->nullable();
            $table->longText('script')->nullable();
            $table->json('outline')->nullable();
            $table->json('sources')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_topics');
    }
};
