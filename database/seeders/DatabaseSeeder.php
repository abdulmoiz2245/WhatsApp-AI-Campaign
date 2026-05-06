<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Contact;
use App\Models\Message;
use App\Models\NewsArticle;
use App\Models\Segment;
use App\Models\User;
use App\Models\UserSetting;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'demo@local.test'],
            ['name' => 'Admin User', 'password' => Hash::make('password')]
        );

        UserSetting::firstOrCreate(['user_id' => $user->id]);

        // Segments
        $all = Segment::firstOrCreate(['user_id' => $user->id, 'name' => 'All Contacts'], ['color' => '#25D366']);
        $tech = Segment::firstOrCreate(['user_id' => $user->id, 'name' => 'Tech Segment'], ['color' => '#3b82f6']);
        $news = Segment::firstOrCreate(['user_id' => $user->id, 'name' => 'News Subscribers'], ['color' => '#a78bfa']);
        $vip = Segment::firstOrCreate(['user_id' => $user->id, 'name' => 'VIP'], ['color' => '#f59e0b']);

        // Contacts
        if (Contact::where('user_id', $user->id)->count() < 30) {
            $contacts = Contact::factory()->count(30)->create(['user_id' => $user->id]);
            $contacts->take(8)->each(fn ($c) => $c->segments()->syncWithoutDetaching([$tech->id]));
            $contacts->skip(8)->take(15)->each(fn ($c) => $c->segments()->syncWithoutDetaching([$news->id]));
            $contacts->skip(23)->each(fn ($c) => $c->segments()->syncWithoutDetaching([$vip->id]));
        }

        // Sample Pakistani news (matches mockup vibe)
        $sampleNews = [
            ['Geo', 'ur', 'politics', 'عمران خان کی رہائی پر عوامی ری ایکشن — تجزیہ', 'پی ٹی آئی کے سربراہ کی رہائی کے بعد سیاسی حلقوں میں نئی صف بندی، عوام کا ردعمل اور ماہرین کی آراء۔', true, 1],
            ['Dawn', 'en', 'business', 'Pakistan Budget 2026 — Key Highlights', 'Finance Minister presents the federal budget with new tax slabs, IT sector incentives, and energy subsidies.', true, 2],
            ['Express', 'ur', 'weather', 'کراچی موسم — گرمی کی لہر کا الرٹ', 'محکمہ موسمیات کے مطابق آئندہ تین دن کراچی میں شدید گرمی، شہریوں کو احتیاطی تدابیر اپنانے کی ہدایت۔', true, 3],
            ['BBC Urdu', 'ur', 'politics', 'اسلام آباد جلسے کی تیاریاں عروج پر', 'حکومت اور حزب اختلاف دونوں کی جانب سے بڑے جلسے، سیکیورٹی انتظامات اور ٹریفک پلان کا اعلان۔', false, 6],
            ['Geo', 'ur', 'sports', 'پاکستان کرکٹ — ورلڈ کپ اسکواڈ کا اعلان', 'پی سی بی نے 15 رکنی اسکواڈ کا اعلان کر دیا، نوجوان کھلاڑیوں کو موقع، تجربہ کار شامل۔', true, 5],
            ['Dawn', 'en', 'tech', 'AI Trends 2026 — What Pakistani Startups Should Watch', 'A roundup of the AI tools and trends most relevant to local startups and SMBs in 2026.', false, 12],
            ['Express', 'ur', 'politics', 'سینیٹر ملک کیس اپ ڈیٹ', 'عدالتی کارروائی کا تازہ ترین جائزہ، وکلاء کے دلائل اور آئندہ سماعت کی تاریخ۔', false, 28],
            ['ARY', 'en', 'business', 'Lahore Metro — New Route Inauguration This Sunday', 'A new 14-km route opens this Sunday connecting downtown to the airport.', false, 16],
            ['BBC Urdu', 'ur', 'business', 'پاکستان میں مہنگائی کے اثرات', 'صارفین کا ماہانہ بجٹ کیسے متاثر ہو رہا ہے، اشیائے ضروریہ کی قیمتوں کا جائزہ۔', false, 36],
            ['Geo', 'ur', 'politics', 'اسلام آباد — نئی ہاؤسنگ اسکیم کا افتتاح', 'وزیراعظم نے کم آمدنی والے طبقے کے لیے نئی اسکیم کا افتتاح کر دیا۔', false, 9],
            ['Dawn', 'en', 'tech', 'WhatsApp launches new business tools', 'Meta announces template enhancements, broadcast lists, and analytics dashboards for business users.', false, 18],
            ['Express', 'ur', 'sports', 'ہاکی ٹیم کی فتح — قوم کا جشن', 'پاکستان نے ٹورنامنٹ میں اہم میچ جیت لیا، تمغے کی امید روشن۔', false, 48],
        ];

        foreach ($sampleNews as [$source, $lang, $cat, $title, $summary, $trending, $hoursAgo]) {
            $extId = sha1($title);
            NewsArticle::updateOrCreate(['external_id' => $extId], [
                'source' => $source,
                'source_url' => 'https://example.com/' . $extId,
                'language' => $lang,
                'category' => $cat,
                'region' => 'PK',
                'title' => $title,
                'summary' => $summary,
                'trending' => $trending,
                'published_at' => Carbon::now()->subHours($hoursAgo),
            ]);
        }

        // Campaigns matching the mockup language
        $campaignSeed = [
            ['name' => 'پاکستان بجٹ 2026 — اہم نکات', 'type' => 'promotional', 'status' => Campaign::STATUS_ACTIVE,
             'segment_id' => $news->id, 'message_body' => 'بجٹ 2026 کے اہم نکات جانیں — مکمل ویڈیو دیکھیں',
             'total_recipients' => 18540, 'sent_count' => 18000, 'delivered_count' => 17800, 'read_count' => 13800,
             'scheduled_at' => Carbon::today()->setTime(19, 0)],
            ['name' => 'کراچی موسم — گرمی کی لہر الرٹ', 'type' => 'broadcast', 'status' => Campaign::STATUS_ACTIVE,
             'segment_id' => $all->id, 'message_body' => 'کراچی میں گرمی کی شدید لہر — احتیاط کریں',
             'total_recipients' => 24300, 'sent_count' => 24300, 'delivered_count' => 23900, 'read_count' => 17600],
            ['name' => 'لاہور میٹرو — نیا روٹ افتتاح', 'type' => 'promotional', 'status' => Campaign::STATUS_SCHEDULED,
             'segment_id' => $all->id, 'message_body' => 'اتوار 7 بجے نیا میٹرو روٹ شروع ہو رہا ہے',
             'total_recipients' => 11760, 'scheduled_at' => Carbon::now()->addDays(2)->setTime(19, 0)],
            ['name' => 'پاکستان کرکٹ — ورلڈ کپ اسکواڈ', 'type' => 'broadcast', 'status' => Campaign::STATUS_ACTIVE,
             'segment_id' => $all->id, 'message_body' => 'ورلڈ کپ اسکواڈ کا اعلان — تفصیلات دیکھیں',
             'total_recipients' => 31200, 'sent_count' => 31000, 'delivered_count' => 30500, 'read_count' => 22600],
            ['name' => 'اسلام آباد — نئی ہاؤسنگ اسکیم', 'type' => 'promotional', 'status' => Campaign::STATUS_PAUSED,
             'segment_id' => $news->id, 'message_body' => 'نئی ہاؤسنگ اسکیم کی مکمل تفصیلات',
             'total_recipients' => 6450, 'sent_count' => 3200, 'delivered_count' => 3100, 'read_count' => 2400],
        ];

        foreach ($campaignSeed as $c) {
            Campaign::firstOrCreate(
                ['user_id' => $user->id, 'name' => $c['name']],
                array_merge($c, ['user_id' => $user->id])
            );
        }

        // Sample inbound + outbound messages for Recent Activity
        if (Message::where('user_id', $user->id)->count() < 20) {
            $contactsForMsgs = Contact::where('user_id', $user->id)->take(8)->get();
            $activeCampaign = Campaign::where('user_id', $user->id)->where('status', Campaign::STATUS_ACTIVE)->first();
            foreach ($contactsForMsgs as $i => $contact) {
                Message::create([
                    'user_id' => $user->id,
                    'campaign_id' => $activeCampaign?->id,
                    'contact_id' => $contact->id,
                    'direction' => 'outbound',
                    'to_phone' => $contact->phone,
                    'provider' => 'meta',
                    'type' => 'text',
                    'body' => 'بجٹ 2026 — مکمل تفصیلات',
                    'status' => $i % 4 === 0 ? Message::STATUS_READ : Message::STATUS_DELIVERED,
                    'sent_at' => Carbon::now()->subMinutes(rand(2, 240)),
                    'delivered_at' => Carbon::now()->subMinutes(rand(1, 200)),
                ]);
            }
        }
    }
}
