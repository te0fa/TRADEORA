import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { user_id, title, body, url, tag } = await req.json();

    // جلب subscriptions للمستخدم
    const query = user_id
      ? supabase.from('push_subscriptions').select('*').eq('user_id', user_id)
      : supabase.from('push_subscriptions').select('*');

    const { data: subs } = await query;

    if (!subs?.length) {
      return NextResponse.json({ sent: 0 });
    }

    const payload = JSON.stringify({
      title: title || '📊 TRADEORA',
      body:  body  || 'إشعار جديد',
      url:   url   || '/',
      tag:   tag   || 'tradeora',
      icon:  '/icon-192.png',
    });

    let sent = 0;
    const failed: string[] = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth:   sub.auth_key,
          }
        }, payload);
        sent++;
      } catch (err: any) {
        // حذف subscription منتهي الصلاحية
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        failed.push(sub.id);
      }
    }

    return NextResponse.json({ sent, failed: failed.length });
  } catch (error: any) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
