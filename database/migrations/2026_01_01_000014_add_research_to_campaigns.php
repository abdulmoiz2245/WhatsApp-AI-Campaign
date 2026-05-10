<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->foreignId('research_topic_id')->nullable()->after('segment_id')->constrained('research_topics')->nullOnDelete();
            $table->foreignId('pipeline_job_id')->nullable()->after('research_topic_id')->constrained('pipeline_jobs')->nullOnDelete();
            $table->json('send_parts')->nullable()->after('media_type');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropConstrainedForeignId('research_topic_id');
            $table->dropConstrainedForeignId('pipeline_job_id');
            $table->dropColumn('send_parts');
        });
    }
};
