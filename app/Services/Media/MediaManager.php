<?php

namespace App\Services\Media;

use App\Models\User;
use App\Services\Media\Contracts\TextToSpeech;
use App\Services\Media\Contracts\VideoComposer;
use InvalidArgumentException;

class MediaManager
{
    public function ttsFor(User $user): TextToSpeech
    {
        $s = $user->effectiveSettings();
        $driver = $s->tts_driver ?: config('services.tts.driver', 'elevenlabs');

        $userVoiceId = (string) ($s->elevenlabs_voice_id ?? '');
        $voiceId = preg_match('/^[A-Za-z0-9]{15,40}$/', $userVoiceId)
            ? $userVoiceId
            : (string) config('services.elevenlabs.voice_id');

        return match ($driver) {
            'elevenlabs' => new ElevenLabsTTSDriver(
                apiKey: $s->elevenlabs_api_key ?: (string) config('services.elevenlabs.key'),
                voiceId: $voiceId,
                model: (string) config('services.elevenlabs.model', 'eleven_multilingual_v2'),
            ),
            'openai' => new OpenAITTSDriver(
                apiKey: $s->openai_api_key ?: (string) config('services.openai.key'),
                model: (string) config('services.openai.tts_model', 'tts-1-hd'),
            ),
            default => throw new InvalidArgumentException("Unknown TTS driver: {$driver}"),
        };
    }

    public function videoFor(User $user): VideoComposer
    {
        $s = $user->effectiveSettings();
        $driver = $s->video_driver ?: config('services.video.driver', 'ffmpeg');

        return match ($driver) {
            'ffmpeg' => new FfmpegVideoDriver(
                ffmpeg: (string) config('services.video.ffmpeg', '/usr/bin/ffmpeg'),
                ffprobe: (string) config('services.video.ffprobe', '/usr/bin/ffprobe'),
            ),
            'heygen' => new HeyGenVideoDriver(
                apiKey: $s->heygen_api_key ?: (string) config('services.heygen.key'),
                avatarId: $s->heygen_avatar_id ?: (string) config('services.heygen.avatar_id'),
                voiceId: $s->heygen_voice_id ?: (string) config('services.heygen.voice_id'),
            ),
            default => throw new InvalidArgumentException("Unknown video driver: {$driver}"),
        };
    }
}
