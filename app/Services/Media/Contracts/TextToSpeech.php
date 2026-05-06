<?php

namespace App\Services\Media\Contracts;

interface TextToSpeech
{
    /**
     * Synthesize audio from text and return absolute filesystem path of the saved file.
     *
     * @return array{path: string, duration_ms: int|null, mime: string}
     */
    public function synthesize(string $text, array $options = []): array;

    public function name(): string;
}
