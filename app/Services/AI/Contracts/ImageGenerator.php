<?php

namespace App\Services\AI\Contracts;

interface ImageGenerator
{
    /**
     * Generate an image and persist it to storage. Returns absolute filesystem path.
     */
    public function generate(string $prompt, array $options = []): string;

    public function name(): string;
}
