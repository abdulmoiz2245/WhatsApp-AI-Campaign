<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'whatsapp' => [
        'driver' => env('WHATSAPP_DRIVER', 'meta'),
        'meta' => [
            'phone_number_id' => env('META_WA_PHONE_NUMBER_ID'),
            'business_account_id' => env('META_WA_BUSINESS_ACCOUNT_ID'),
            'access_token' => env('META_WA_ACCESS_TOKEN'),
            'verify_token' => env('META_WA_VERIFY_TOKEN'),
            'api_version' => env('META_WA_API_VERSION', 'v21.0'),
        ],
        'twilio' => [
            'sid' => env('TWILIO_ACCOUNT_SID'),
            'token' => env('TWILIO_AUTH_TOKEN'),
            'from' => env('TWILIO_WHATSAPP_FROM'),
        ],
    ],

    'ai' => [
        'text_driver' => env('AI_TEXT_DRIVER', 'openai'),
        'image_driver' => env('AI_IMAGE_DRIVER', 'openai'),
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'text_model' => env('OPENAI_TEXT_MODEL', 'gpt-4o-mini'),
        'image_model' => env('OPENAI_IMAGE_MODEL', 'dall-e-3'),
        'tts_model' => env('OPENAI_TTS_MODEL', 'tts-1-hd'),
    ],

    'anthropic' => [
        'key' => env('ANTHROPIC_API_KEY'),
        'text_model' => env('ANTHROPIC_TEXT_MODEL', 'claude-sonnet-4-6'),
    ],

    'tts' => [
        'driver' => env('TTS_DRIVER', 'elevenlabs'),
    ],

    'elevenlabs' => [
        'key' => env('ELEVENLABS_API_KEY'),
        'voice_id' => env('ELEVENLABS_VOICE_ID', '21m00Tcm4TlvDq8ikWAM'),
        'model' => env('ELEVENLABS_MODEL', 'eleven_multilingual_v2'),
    ],

    'video' => [
        'driver' => env('VIDEO_DRIVER', 'ffmpeg'),
        'ffmpeg' => env('FFMPEG_BINARY', '/usr/bin/ffmpeg'),
        'ffprobe' => env('FFPROBE_BINARY', '/usr/bin/ffprobe'),
    ],

    'heygen' => [
        'key' => env('HEYGEN_API_KEY'),
        'avatar_id' => env('HEYGEN_AVATAR_ID'),
        'voice_id' => env('HEYGEN_VOICE_ID'),
    ],

    'scheduler' => [
        'publish_hour' => (int) env('SCHEDULER_PUBLISH_HOUR', 19),
        'publish_minute' => (int) env('SCHEDULER_PUBLISH_MINUTE', 0),
    ],

];
