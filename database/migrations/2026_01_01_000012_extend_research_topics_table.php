<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_topics', function (Blueprint $table) {
            $table->string('depth', 24)->default('standard')->after('content_type'); // quick | standard | deep
            $table->string('audience_language', 24)->default('ur')->after('language'); // ur | en | bilingual
            $table->foreignId('news_article_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('research_topics', function (Blueprint $table) {
            $table->dropConstrainedForeignId('news_article_id');
            $table->dropColumn(['depth', 'audience_language']);
        });
    }
};
