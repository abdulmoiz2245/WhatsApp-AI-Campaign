<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_topics', function (Blueprint $table) {
            $table->json('enabled_stages')->nullable()->after('metadata');
        });

        Schema::table('pipeline_jobs', function (Blueprint $table) {
            $table->json('enabled_stages')->nullable()->after('stages');
        });
    }

    public function down(): void
    {
        Schema::table('research_topics', function (Blueprint $table) {
            $table->dropColumn('enabled_stages');
        });
        Schema::table('pipeline_jobs', function (Blueprint $table) {
            $table->dropColumn('enabled_stages');
        });
    }
};
