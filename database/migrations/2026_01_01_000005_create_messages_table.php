<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->string('direction', 16)->default('outbound'); // outbound, inbound
            $table->string('to_phone', 32)->nullable();
            $table->string('from_phone', 32)->nullable();
            $table->string('provider', 16)->default('meta'); // meta, twilio
            $table->string('provider_message_id')->nullable()->index();
            $table->string('type', 24)->default('text'); // text, image, video, audio, document, template
            $table->longText('body')->nullable();
            $table->string('media_url')->nullable();
            $table->string('status', 24)->default('queued'); // queued, sending, sent, delivered, read, failed, replied
            $table->json('payload')->nullable();
            $table->json('error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['campaign_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
