<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_settings', function (Blueprint $table) {
            $table->string('wppconnect_base_url')->nullable()->after('twilio_whatsapp_from');
            $table->text('wppconnect_secret')->nullable()->after('wppconnect_base_url');
            $table->string('wppconnect_session')->nullable()->after('wppconnect_secret');
            $table->string('wppconnect_webhook_secret')->nullable()->after('wppconnect_session');
        });
    }

    public function down(): void
    {
        Schema::table('user_settings', function (Blueprint $table) {
            $table->dropColumn([
                'wppconnect_base_url',
                'wppconnect_secret',
                'wppconnect_session',
                'wppconnect_webhook_secret',
            ]);
        });
    }
};
