<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_articles', function (Blueprint $table) {
            $table->id();
            $table->string('source', 64);              // e.g. "Dawn", "Geo", "Express", "BBC Urdu"
            $table->string('source_url')->nullable();
            $table->string('language', 16)->default('ur'); // ur, en
            $table->string('category', 64)->nullable();    // politics, sports, business, tech…
            $table->string('region', 64)->default('PK');   // PK, world, etc.
            $table->string('title');
            $table->longText('summary')->nullable();
            $table->string('image_url')->nullable();
            $table->string('external_id')->nullable();     // hash of url, used for dedupe
            $table->timestamp('published_at')->nullable();
            $table->boolean('trending')->default(false);
            $table->timestamps();

            $table->index(['language', 'region', 'published_at']);
            $table->unique('external_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_articles');
    }
};
