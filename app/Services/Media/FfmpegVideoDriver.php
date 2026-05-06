<?php

namespace App\Services\Media;

use App\Services\Media\Contracts\VideoComposer;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\Process;

class FfmpegVideoDriver implements VideoComposer
{
    public function __construct(
        protected string $ffmpeg = '/usr/bin/ffmpeg',
        protected string $ffprobe = '/usr/bin/ffprobe',
    ) {}

    public function name(): string { return 'ffmpeg'; }

    /**
     * Builds a 1080x1920 (or configurable) slideshow video by stretching each
     * image evenly across the duration of the audio track. Audio is required.
     */
    public function compose(array $inputs): string
    {
        $audio = $inputs['audio_path'] ?? null;
        $images = $inputs['images'] ?? [];
        $resolution = $inputs['resolution'] ?? '1080x1920';

        if (! $audio || ! is_file($audio)) {
            throw new RuntimeException('FFmpeg driver requires an audio_path.');
        }
        if (empty($images)) {
            throw new RuntimeException('FFmpeg driver requires at least one image.');
        }

        $audioDuration = $this->probeDurationSeconds($audio);
        $perImage = max(1.0, round($audioDuration / count($images), 3));

        // Build a concat file describing how long each image is shown.
        $concatList = '';
        foreach ($images as $img) {
            $concatList .= "file '" . str_replace("'", "'\\''", $img) . "'\n";
            $concatList .= "duration {$perImage}\n";
        }
        // ffmpeg concat demuxer requires the last file repeated without duration.
        $concatList .= "file '" . str_replace("'", "'\\''", end($images)) . "'\n";

        $concatPath = sys_get_temp_dir() . '/concat_' . Str::uuid() . '.txt';
        file_put_contents($concatPath, $concatList);

        $relOut = 'videos/' . Str::uuid() . '.mp4';
        Storage::disk('public')->put($relOut, '');
        $outAbs = Storage::disk('public')->path($relOut);

        [$w, $h] = array_map('intval', explode('x', $resolution));

        $cmd = [
            $this->ffmpeg, '-y',
            '-f', 'concat', '-safe', '0', '-i', $concatPath,
            '-i', $audio,
            '-vf', "scale={$w}:{$h}:force_original_aspect_ratio=decrease,pad={$w}:{$h}:(ow-iw)/2:(oh-ih)/2,format=yuv420p,fps=30",
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium',
            '-c:a', 'aac', '-b:a', '192k',
            '-shortest',
            $outAbs,
        ];

        $process = new Process($cmd);
        $process->setTimeout(900);
        $process->run();

        @unlink($concatPath);

        if (! $process->isSuccessful()) {
            throw new RuntimeException('FFmpeg failed: ' . $process->getErrorOutput());
        }

        return $outAbs;
    }

    protected function probeDurationSeconds(string $path): float
    {
        $process = new Process([
            $this->ffprobe, '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            $path,
        ]);
        $process->run();
        $out = trim($process->getOutput());
        return $out === '' ? 30.0 : (float) $out;
    }
}
