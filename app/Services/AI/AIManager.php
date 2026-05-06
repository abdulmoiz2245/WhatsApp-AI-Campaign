<?php

namespace App\Services\AI;

use App\Models\User;
use App\Services\AI\Contracts\ImageGenerator;
use App\Services\AI\Contracts\TextGenerator;
use InvalidArgumentException;

class AIManager
{
    public function textFor(User $user): TextGenerator
    {
        $s = $user->effectiveSettings();
        $driver = $s->ai_text_driver ?: config('services.ai.text_driver', 'openai');

        return match ($driver) {
            'openai' => new OpenAITextDriver(
                apiKey: $s->openai_api_key ?: (string) config('services.openai.key'),
                model: $s->openai_text_model ?: (string) config('services.openai.text_model'),
            ),
            'anthropic' => new AnthropicTextDriver(
                apiKey: $s->anthropic_api_key ?: (string) config('services.anthropic.key'),
                model: $s->anthropic_text_model ?: (string) config('services.anthropic.text_model'),
            ),
            default => throw new InvalidArgumentException("Unknown AI text driver: {$driver}"),
        };
    }

    public function imageFor(User $user): ImageGenerator
    {
        $s = $user->effectiveSettings();
        $driver = $s->ai_image_driver ?: config('services.ai.image_driver', 'openai');

        return match ($driver) {
            'openai' => new OpenAIImageDriver(
                apiKey: $s->openai_api_key ?: (string) config('services.openai.key'),
                model: $s->openai_image_model ?: (string) config('services.openai.image_model'),
            ),
            default => throw new InvalidArgumentException("Unknown AI image driver: {$driver}"),
        };
    }
}
