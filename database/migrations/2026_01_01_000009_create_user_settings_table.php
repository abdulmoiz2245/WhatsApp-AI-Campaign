<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            $table->string('whatsapp_driver', 16)->default('meta');
            $table->string('meta_phone_number_id')->nullable();
            $table->string('meta_business_account_id')->nullable();
            $table->text('meta_access_token')->nullable();
            $table->string('meta_verify_token')->nullable();
            $table->string('twilio_account_sid')->nullable();
            $table->text('twilio_auth_token')->nullable();
            $table->string('twilio_whatsapp_from')->nullable();

            $table->string('ai_text_driver', 16)->default('openai');
            $table->string('ai_image_driver', 16)->default('openai');
            $table->text('openai_api_key')->nullable();
            $table->string('openai_text_model')->nullable();
            $table->string('openai_image_model')->nullable();
            $table->text('anthropic_api_key')->nullable();
            $table->string('anthropic_text_model')->nullable();

            $table->string('tts_driver', 16)->default('elevenlabs');
            $table->text('elevenlabs_api_key')->nullable();
            $table->string('elevenlabs_voice_id')->nullable();

            $table->string('video_driver', 16)->default('ffmpeg');
            $table->text('heygen_api_key')->nullable();
            $table->string('heygen_avatar_id')->nullable();
            $table->string('heygen_voice_id')->nullable();

            $table->string('timezone', 64)->default('Asia/Karachi');
            $table->unsignedTinyInteger('publish_hour')->default(19);
            $table->unsignedTinyInteger('publish_minute')->default(0);

            $table->boolean('notif_email_on_publish')->default(true);
            $table->boolean('notif_email_on_failure')->default(true);
            $table->boolean('notif_in_app')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
