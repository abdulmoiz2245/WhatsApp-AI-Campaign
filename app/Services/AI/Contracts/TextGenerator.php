<?php

namespace App\Services\AI\Contracts;

interface TextGenerator
{
    /**
     * Run a chat-style completion. $messages is an array of
     * ['role' => 'system'|'user'|'assistant', 'content' => string].
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     * @param  array<string, mixed>  $options
     */
    public function complete(array $messages, array $options = []): string;

    public function name(): string;
}
