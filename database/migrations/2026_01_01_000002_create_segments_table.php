<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('segments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('color', 16)->default('#7c3aed');
            $table->json('rules')->nullable(); // optional dynamic filter
            $table->timestamps();
        });

        Schema::create('contact_segment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignId('segment_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['contact_id', 'segment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_segment');
        Schema::dropIfExists('segments');
    }
};
