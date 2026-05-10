<?php

use App\Http\Controllers\CampaignController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\PipelineController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ResearchController;
use App\Http\Controllers\SchedulerController;
use App\Http\Controllers\SegmentController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\WppConnectController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
    Route::post('/contacts', [ContactController::class, 'store'])->name('contacts.store');
    Route::post('/contacts/import', [ContactController::class, 'import'])->name('contacts.import');
    Route::get('/contacts/{contact}', [ContactController::class, 'show'])->name('contacts.show');
    Route::patch('/contacts/{contact}', [ContactController::class, 'update'])->name('contacts.update');
    Route::delete('/contacts/{contact}', [ContactController::class, 'destroy'])->name('contacts.destroy');
    Route::post('/contacts/{contact}/messages', [ContactController::class, 'sendMessage'])->name('contacts.send');

    Route::post('/segments', [SegmentController::class, 'store'])->name('segments.store');
    Route::patch('/segments/{segment}', [SegmentController::class, 'update'])->name('segments.update');
    Route::delete('/segments/{segment}', [SegmentController::class, 'destroy'])->name('segments.destroy');

    Route::get('/campaigns', [CampaignController::class, 'index'])->name('campaigns.index');
    Route::post('/campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
    Route::post('/campaigns/bulk', [CampaignController::class, 'bulk'])->name('campaigns.bulk');
    Route::patch('/campaigns/{campaign}', [CampaignController::class, 'update'])->name('campaigns.update');
    Route::delete('/campaigns/{campaign}', [CampaignController::class, 'destroy'])->name('campaigns.destroy');
    Route::post('/campaigns/{campaign}/start', [CampaignController::class, 'start'])->name('campaigns.start');
    Route::post('/campaigns/{campaign}/resend', [CampaignController::class, 'resend'])->name('campaigns.resend');
    Route::post('/campaigns/{campaign}/pause', [CampaignController::class, 'pause'])->name('campaigns.pause');
    Route::post('/campaigns/{campaign}/resume', [CampaignController::class, 'resume'])->name('campaigns.resume');

    Route::get('/news', [NewsController::class, 'index'])->name('news.index');
    Route::post('/news/fetch', [NewsController::class, 'fetch'])->name('news.fetch');
    Route::post('/news/archive-all', [NewsController::class, 'archiveAll'])->name('news.archiveAll');
    Route::post('/news/archive-bulk', [NewsController::class, 'archiveBulk'])->name('news.archiveBulk');
    Route::post('/news/{news}/research', [NewsController::class, 'research'])->name('news.research');
    Route::post('/news/{news}/archive', [NewsController::class, 'archive'])->name('news.archive');
    Route::post('/news/{news}/unarchive', [NewsController::class, 'unarchive'])->name('news.unarchive');

    Route::get('/research', [ResearchController::class, 'index'])->name('research.index');
    Route::post('/research', [ResearchController::class, 'store'])->name('research.store');
    Route::get('/research/{topic}', [ResearchController::class, 'show'])->name('research.show');
    Route::delete('/research/{topic}', [ResearchController::class, 'destroy'])->name('research.destroy');

    Route::get('/pipeline', [PipelineController::class, 'index'])->name('pipeline.index');
    Route::post('/pipeline', [PipelineController::class, 'store'])->name('pipeline.store');
    Route::get('/pipeline/{pipeline}', [PipelineController::class, 'show'])->name('pipeline.show');
    Route::post('/pipeline/{pipeline}/retry', [PipelineController::class, 'retry'])->name('pipeline.retry');
    Route::patch('/pipeline/{pipeline}/script', [PipelineController::class, 'updateScript'])->name('pipeline.script');
    Route::post('/pipeline/{pipeline}/regenerate/{stage}', [PipelineController::class, 'regenerate'])->name('pipeline.regenerate');
    Route::delete('/pipeline/{pipeline}', [PipelineController::class, 'destroy'])->name('pipeline.destroy');

    Route::get('/scheduler', [SchedulerController::class, 'index'])->name('scheduler.index');
    Route::post('/scheduler', [SchedulerController::class, 'store'])->name('scheduler.store');
    Route::patch('/scheduler/{scheduledPost}', [SchedulerController::class, 'update'])->name('scheduler.update');
    Route::delete('/scheduler/{scheduledPost}', [SchedulerController::class, 'destroy'])->name('scheduler.destroy');

    Route::get('/settings', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::patch('/settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::post('/settings/test-connection', [SettingsController::class, 'testConnection'])->name('settings.test');

    Route::get('/settings/wppconnect', [WppConnectController::class, 'page'])->name('settings.wppconnect');
    Route::get('/settings/wppconnect/status', [WppConnectController::class, 'status'])->name('settings.wppconnect.status');
    Route::post('/settings/wppconnect/start', [WppConnectController::class, 'start'])->name('settings.wppconnect.start');
    Route::get('/settings/wppconnect/qr', [WppConnectController::class, 'qr'])->name('settings.wppconnect.qr');
    Route::post('/settings/wppconnect/logout', [WppConnectController::class, 'logout'])->name('settings.wppconnect.logout');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
