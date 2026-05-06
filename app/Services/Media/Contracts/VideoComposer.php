<?php

namespace App\Services\Media\Contracts;

interface VideoComposer
{
    /**
     * Compose a video from inputs and return absolute filesystem path.
     *
     * Inputs:
     *  - audio_path:  string (absolute, optional for avatar drivers)
     *  - images:      list<string> absolute paths to slideshow frames
     *  - script:      string (used by avatar drivers)
     *  - title:       ?string overlay
     *  - resolution:  ?string e.g. "1080x1920"
     */
    public function compose(array $inputs): string;

    public function name(): string;
}
