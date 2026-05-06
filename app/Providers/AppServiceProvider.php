<?php

namespace App\Providers;

use App\Models\User;
use App\Models\UserSetting;
use App\Services\AI\AIManager;
use App\Services\Media\MediaManager;
use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(WhatsAppManager::class);
        $this->app->singleton(AIManager::class);
        $this->app->singleton(MediaManager::class);
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Auto-create UserSetting when a user is created.
        User::created(function (User $user) {
            if (! $user->settings) {
                UserSetting::create(['user_id' => $user->id]);
            }
        });
    }
}
