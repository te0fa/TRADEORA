import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const msg  = body?.message;

    if (!msg) return NextResponse.json({ ok: true });

    const chatId = msg.chat?.id?.toString();
    const text   = msg.text?.trim();

    // Verify /start CODE payload
    // CODE = user UUID from Settings/Profile
    if (text?.startsWith('/start ')) {
      const userId = text.replace('/start ', '').trim();

      if (userId && userId.length === 36) {
        // Upsert verified link
        const { error } = await supabase.from('user_telegram').upsert([{
          user_id: userId,
          chat_id: chatId,
          verified: true,
          linked_at: new Date().toISOString()
        }]);

        if (error) {
          console.error('Error upserting user telegram info:', error);
          return NextResponse.json({ ok: false, error: error.message });
        }

        // Welcome message via Bot API
        if (BOT_TOKEN) {
          await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `🎉 <b>تم ربط حسابك بـ TRADEORA بنجاح!</b>\n\nستصلك الآن تنبيهات دورية تشمل:\n✅ عند ضرب الهدف الأول (TP1)\n✅ عند ضرب الهدف الثاني (TP2)\n🚨 عند ملامسة أو كسر وقف الخسارة\n🔔 عند تفعيل أي من تنبيهات الأسعار التي تحددها\n\n<i>يمكنك تعديل خيارات التنبيه وتخصيصها في أي وقت من إعدادات حسابك.</i>`,
                parse_mode: 'HTML',
              })
            }
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error in Telegram Webhook endpoint:', error);
    return NextResponse.json({ ok: true }); // Always return OK to TG to avoid repeat retry loops
  }
}
