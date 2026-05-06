<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('phone', 32);
            $table->string('email')->nullable();
            $table->string('avatar')->nullable();
            $table->string('country', 64)->nullable();
            $table->string('language', 16)->default('en');
            $table->string('status', 24)->default('active'); // active, opted_out, blocked
            $table->json('tags')->nullable();
            $table->json('attributes')->nullable();
            $table->timestamp('last_messaged_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'phone']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
