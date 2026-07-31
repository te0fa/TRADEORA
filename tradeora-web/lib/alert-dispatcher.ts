/**
 * lib/alert-dispatcher.ts
 * ========================
 * Unified Alert Dispatcher – يُرسل تنبيهات إشارات الخروج الذكية عبر:
 *   1. Telegram Bot (broadcast channel + per-user DMs)
 *   2. Web Push Notifications (VAPID)
 *   3. In-app trade_alerts table (Supabase Realtime)
 *   [4. WhatsApp - معمار جاهز، يحتاج API credentials]
 *
 * الاستخدام:
 *   import { dispatchTradeAlert } from '@/lib/alert-dispatcher';
 *   await dispatchTradeAlert(sb, alert);
 */

import { SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// ── VAPID setup (Web Push) ────────────────────────────────────────────────────
if (
  typeof process !== 'undefined' &&
  process.env.VAPID_EMAIL &&
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type AlertUrgency = 'critical' | 'high' | 'medium' | 'low';

export interface TradeAlert {
  trade_id:    string;
  symbol:      string;
  reason:      string;         // machine key e.g. 'trailing_stop'
  reason_ar:   string;         // Arabic message for users
  urgency:     AlertUrgency;
  pnl_pct?:    number;         // current P&L%
  exit_price?: number;
  new_sl?:     number;
  user_ids?:   string[];       // specific users, or broadcast if empty
}

// ── Emoji + Labels ────────────────────────────────────────────────────────────
const URGENCY_EMOJI: Record<AlertUrgency, string> = {
  critical: '🚨',
  high:     '⚠️',
  medium:   '🟡',
  low:      '📊',
};

const URGENCY_LABEL_AR: Record<AlertUrgency, string> = {
  critical: 'طارئ – اكشن فوري مطلوب',
  high:     'تحذير عالي الأولوية',
  medium:   'تنبيه – تابع الموقف',
  low:      'معلومة',
};

const EXIT_REASON_AR: Record<string, string> = {
  trailing_stop:         '🛡️ وقف متحرك مُفعَّل',
  rsi_extreme_exhaustion:'📈 إجهاد شرائي شديد',
  rsi_exhaustion_warning:'📈 تحذير إجهاد RSI',
  macd_dead_cross:       '📉 تقاطع MACD سلبي',
  macd_dead_cross_losing:'📉 MACD سلبي مع خسارة',
  ema20_break:           '📊 كسر EMA20',
  volume_divergence:     '📦 تباعد حجم/سعر',
  momentum_collapse:     '💥 انهيار زخم',
  tp1:                   '🎯 الهدف الأول محقق',
  tp2:                   '🎯🎯 الهدف الثاني محقق',
  sl:                    '🛑 وقف الخسارة مُفعَّل',
  breakeven:             '🔄 خروج بتعادل (Break-even)',
  expired_no_movement:   '⏰ صفقة منتهية بلا حركة',
};

// ── Format Telegram Message ────────────────────────────────────────────────────
function formatTelegramMessage(alert: TradeAlert): string {
  const emoji   = URGENCY_EMOJI[alert.urgency];
  const label   = URGENCY_LABEL_AR[alert.urgency];
  const reason  = EXIT_REASON_AR[alert.reason] || alert.reason;
  const pnlStr  = alert.pnl_pct !== undefined
    ? `\n💰 <b>P&amp;L الحالي:</b> ${alert.pnl_pct >= 0 ? '+' : ''}${alert.pnl_pct.toFixed(1)}%`
    : '';
  const slStr   = alert.new_sl !== undefined
    ? `\n🛡️ <b>وقف الخسارة الجديد:</b> ${alert.new_sl.toFixed(2)} ج.م`
    : '';
  const exitStr = alert.exit_price !== undefined
    ? `\n💵 <b>سعر الخروج:</b> ${alert.exit_price.toFixed(2)} ج.م`
    : '';

  return (
    `${emoji} <b>TRADEORA – ${label}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 <b>السهم:</b> ${alert.symbol}\n` +
    `📋 <b>الإشارة:</b> ${reason}\n` +
    `📝 <b>التفاصيل:</b> ${alert.reason_ar}` +
    pnlStr + slStr + exitStr +
    `\n━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>منصة TRADEORA للتحليل الذكي</i>`
  );
}

// ── Send Telegram ──────────────────────────────────────────────────────────────
async function sendTelegram(chatId: string, message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
    const data = await res.json() as any;
    return data.ok === true;
  } catch {
    return false;
  }
}

// ── Send Web Push ──────────────────────────────────────────────────────────────
async function sendWebPush(
  sb: SupabaseClient,
  alert: TradeAlert,
  userIds?: string[]
): Promise<number> {
  try {
    const query = userIds?.length
      ? sb.from('push_subscriptions').select('*').in('user_id', userIds)
      : sb.from('push_subscriptions').select('*');

    const { data: subs } = await query;
    if (!subs?.length) return 0;

    const emoji = URGENCY_EMOJI[alert.urgency];
    const payload = JSON.stringify({
      title: `${emoji} ${alert.symbol} – ${EXIT_REASON_AR[alert.reason] || alert.reason}`,
      body:  alert.reason_ar,
      url:   `/trades`,
      tag:   `exit-${alert.trade_id}`,
      icon:  '/icon-192.png',
      badge: '/badge-72.png',
      data:  { trade_id: alert.trade_id, urgency: alert.urgency },
    });

    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await sb.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }
    return sent;
  } catch {
    return 0;
  }
}

// ── Save to In-App trade_alerts table (Supabase Realtime) ─────────────────────
async function saveInAppAlert(sb: SupabaseClient, alert: TradeAlert): Promise<void> {
  try {
    const rows = alert.user_ids?.length
      ? alert.user_ids.map(uid => ({
          trade_id:   alert.trade_id,
          user_id:    uid,
          symbol:     alert.symbol,
          reason:     alert.reason,
          reason_ar:  alert.reason_ar,
          urgency:    alert.urgency,
          pnl_pct:    alert.pnl_pct ?? null,
          exit_price: alert.exit_price ?? null,
          new_sl:     alert.new_sl ?? null,
          is_read:    false,
          created_at: new Date().toISOString(),
        }))
      : [{
          trade_id:   alert.trade_id,
          user_id:    null,                  // broadcast (visible to all)
          symbol:     alert.symbol,
          reason:     alert.reason,
          reason_ar:  alert.reason_ar,
          urgency:    alert.urgency,
          pnl_pct:    alert.pnl_pct ?? null,
          exit_price: alert.exit_price ?? null,
          new_sl:     alert.new_sl ?? null,
          is_read:    false,
          created_at: new Date().toISOString(),
        }];

    await sb.from('trade_alerts').insert(rows as any[]);
  } catch {
    // Non-critical: don't fail the whole dispatch
  }
}

// ── Deduplication: avoid sending same alert twice ──────────────────────────────
const sentAlertCache = new Map<string, number>(); // key → timestamp
const DEDUPE_MS = 30 * 60 * 1000; // 30 minutes

function isDuplicate(tradeId: string, reason: string): boolean {
  const key = `${tradeId}:${reason}`;
  const last = sentAlertCache.get(key);
  if (last && Date.now() - last < DEDUPE_MS) return true;
  sentAlertCache.set(key, Date.now());
  // Prune old entries
  if (sentAlertCache.size > 500) {
    const cutoff = Date.now() - DEDUPE_MS;
    for (const [k, v] of sentAlertCache) {
      if (v < cutoff) sentAlertCache.delete(k);
    }
  }
  return false;
}

// ── Main Dispatcher ────────────────────────────────────────────────────────────
export async function dispatchTradeAlert(
  sb: SupabaseClient,
  alert: TradeAlert,
  options: {
    telegram?: boolean;       // default true
    webPush?: boolean;        // default true
    inApp?: boolean;          // default true
    whatsapp?: boolean;       // default false (needs API)
    minUrgency?: AlertUrgency; // only send if urgency >= this level
  } = {}
): Promise<{ telegram: boolean; push: number; in_app: boolean; deduped: boolean }> {

  const {
    telegram  = true,
    webPush   = true,
    inApp     = true,
    minUrgency = 'medium',
  } = options;

  const URGENCY_RANK: Record<AlertUrgency, number> = {
    critical: 4, high: 3, medium: 2, low: 1
  };

  // Check minimum urgency threshold
  if (URGENCY_RANK[alert.urgency] < URGENCY_RANK[minUrgency]) {
    return { telegram: false, push: 0, in_app: false, deduped: false };
  }

  // Deduplication
  if (isDuplicate(alert.trade_id, alert.reason)) {
    return { telegram: false, push: 0, in_app: false, deduped: true };
  }

  const results = { telegram: false, push: 0, in_app: false, deduped: false };
  const message  = formatTelegramMessage(alert);

  // ── 1. Telegram ──────────────────────────────────────────────────────────
  if (telegram) {
    // Broadcast channel
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (channelId) {
      results.telegram = await sendTelegram(channelId, message);
    }

    // Per-user DMs (if user_ids provided and have telegram_chat_id)
    if (alert.user_ids?.length) {
      const { data: profiles } = await sb
        .from('profiles')
        .select('telegram_chat_id')
        .in('id', alert.user_ids)
        .not('telegram_chat_id', 'is', null);

      if (profiles?.length) {
        await Promise.all(
          profiles.map((p: any) => sendTelegram(p.telegram_chat_id, message))
        );
      }
    }
  }

  // ── 2. Web Push ──────────────────────────────────────────────────────────
  if (webPush) {
    results.push = await sendWebPush(sb, alert, alert.user_ids);
  }

  // ── 3. In-App (Supabase Realtime) ────────────────────────────────────────
  if (inApp) {
    await saveInAppAlert(sb, alert);
    results.in_app = true;
  }

  // ── 4. WhatsApp (Architecture Ready – needs WHATSAPP_TOKEN + phone numbers) ─
  // if (options.whatsapp && process.env.WHATSAPP_TOKEN) {
  //   await sendWhatsApp(alert, message);
  // }

  return results;
}

// ── Convenience: dispatch exit signal directly ────────────────────────────────
export async function dispatchExitSignal(
  sb: SupabaseClient,
  opts: {
    trade_id: string;
    symbol:   string;
    reason:   string;
    reason_ar: string;
    urgency:  AlertUrgency;
    pnl_pct?: number;
    exit_price?: number;
    new_sl?:  number;
    user_ids?: string[];
  }
): Promise<void> {
  await dispatchTradeAlert(sb, {
    trade_id:   opts.trade_id,
    symbol:     opts.symbol,
    reason:     opts.reason,
    reason_ar:  opts.reason_ar,
    urgency:    opts.urgency,
    pnl_pct:    opts.pnl_pct,
    exit_price: opts.exit_price,
    new_sl:     opts.new_sl,
    user_ids:   opts.user_ids,
  }, {
    // Only push critical+high via Telegram/Push to avoid spam
    // medium goes to in-app only
    telegram:   opts.urgency === 'critical' || opts.urgency === 'high',
    webPush:    opts.urgency === 'critical' || opts.urgency === 'high',
    inApp:      true,
    minUrgency: 'medium',
  });
}
