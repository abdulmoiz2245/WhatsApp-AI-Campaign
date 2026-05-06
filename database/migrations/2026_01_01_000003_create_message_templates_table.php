<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('language', 16)->default('en_US');
            $table->string('category', 32)->default('MARKETING'); // MARKETING|UTILITY|AUTHENTICATION
            $table->string('provider_template_name')->nullable(); // Meta-approved name
            $table->string('status', 24)->default('draft'); // draft, pending, approved, rejected
            $table->longText('body');
            $table->json('variables')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'name', 'language']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_templates');
    }
};
