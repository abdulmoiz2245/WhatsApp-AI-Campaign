# WhatsApp AI Campaign

Production-ready Laravel 12 + React (Inertia) starter app for running AI-driven
WhatsApp marketing campaigns. Pluggable WhatsApp providers, pluggable AI
providers, and a content-generation pipeline (script → voiceover → video →
thumbnail → WhatsApp upload) with a built-in scheduler that auto-publishes at
your configured time.

## Features

- **Dashboard** — KPIs, 14-day delivery trend, campaigns by type, recent activity
- **Campaigns** — Promotional / transactional / broadcast / drip, segments, templates, scheduled, paused/resumed
- **Contacts & Segments** — CSV import, segments, opt-out / blocked statuses
- **AI Research** — Topic input → research summary, outline, script, sources, thumbnail prompt
- **AI Pipeline** — Script → ElevenLabs voiceover → DALL-E thumbnail → FFmpeg video (or HeyGen avatar) → WhatsApp media upload
- **Scheduler** — Calendar with auto-publish at configured time (default 19:00 in `APP_TIMEZONE`)
- **Settings** — Per-user encrypted secrets, driver switching for every integration
- **Webhooks** — Verifies and ingests Meta and Twilio status callbacks; updates campaign delivery/read counts and inbound replies

## Tech Stack

- Laravel 12, PHP 8.4, MySQL 8
- Inertia.js + React 18, TailwindCSS, Vite
- Queue: database / Redis (Horizon-ready)
- Tests: Pest

## Pluggable Drivers

| Concern   | Drivers                          | Env switch         |
| --------- | -------------------------------- | ------------------ |
| WhatsApp  | `meta` (Cloud API), `twilio`     | `WHATSAPP_DRIVER`  |
| AI text   | `openai`, `anthropic`            | `AI_TEXT_DRIVER`   |
| AI image  | `openai` (DALL-E)                | `AI_IMAGE_DRIVER`  |
| TTS       | `elevenlabs`, `openai`           | `TTS_DRIVER`       |
| Video     | `ffmpeg` (slideshow), `heygen`   | `VIDEO_DRIVER`     |

Drivers can be overridden per-user in **Settings**; secrets are encrypted with
Laravel's `encrypted` cast and never returned from the API.

## Setup

```bash
git clone <repo> && cd whatsapp-ai-campaign
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Create your MySQL database, then:

```bash
php artisan migrate --seed
php artisan storage:link
npm run build
```

The seeder creates `demo@local.test` / `password` with sample contacts and a campaign.

### Run dev

```bash
php artisan serve
npm run dev
php artisan queue:work       # required for AI pipeline + campaigns
php artisan schedule:work    # required for the auto-publisher
```

### Production checklist

- Use **Redis** for cache, sessions, and queues (`CACHE_STORE=redis`, `SESSION_DRIVER=redis`, `QUEUE_CONNECTION=redis`)
- Run a queue worker (Supervisor / systemd) and Laravel Scheduler (`* * * * * php artisan schedule:run`)
- Install `ffmpeg` and `ffprobe` for the FFmpeg video driver
- Configure S3 (`FILESYSTEM_DISK=s3`) for media so it's reachable by WhatsApp / Twilio
- Set the public webhook URL: `https://YOURAPP/api/webhooks/whatsapp` in your provider console
- Rotate `META_WA_VERIFY_TOKEN` to a long random string

## WhatsApp Webhooks

Single endpoint handles both Meta and Twilio:

- `GET  /api/webhooks/whatsapp` — Meta verification challenge
- `POST /api/webhooks/whatsapp` — Status callbacks + inbound replies

The driver selected by `WHATSAPP_DRIVER` (or per-user setting) determines how
the payload is parsed. All raw payloads are persisted to the `webhook_events`
table for replay and debugging.

## Domain Schema

`users`, `user_settings`, `contacts`, `segments`, `contact_segment`,
`message_templates`, `campaigns`, `messages`, `research_topics`,
`pipeline_jobs`, `scheduled_posts`, `webhook_events` — see
`database/migrations/`.

## Tests

```bash
vendor/bin/pest
```

39 tests covering:
- Auth flows (Breeze defaults)
- Campaign CRUD, dispatch, ownership
- Contact CSV import
- Settings encryption + don't-overwrite-blank-secrets
- Meta + Twilio drivers (HTTP mocks)
- Webhook ingest updates message + campaign counters

## Module Map

| URL          | Page                       | Controller              |
| ------------ | -------------------------- | ----------------------- |
| `/dashboard` | Dashboard                  | `DashboardController`   |
| `/campaigns` | Campaigns                  | `CampaignController`    |
| `/contacts`  | Contacts + Segments        | `ContactController`     |
| `/research`  | AI Research                | `ResearchController`    |
| `/pipeline`  | AI Pipeline                | `PipelineController`    |
| `/scheduler` | Scheduler (calendar)       | `SchedulerController`   |
| `/settings`  | Provider + scheduler config| `SettingsController`    |

## Background Jobs

- `RunResearchJob` — calls the configured AI text driver, persists summary/outline/script
- `RunPipelineJob` — orchestrates script → TTS → image → video → WhatsApp upload
- `DispatchCampaignJob` — fans out per-recipient `SendCampaignMessageJob`
- `SendCampaignMessageJob` — sends one message via the user's WhatsApp driver
- `PublishScheduledPostJob` — publishes a scheduled post when its time arrives

## License

MIT
