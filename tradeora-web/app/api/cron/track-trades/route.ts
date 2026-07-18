import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch active/tp1_hit user trades
    const { data: trades, error: fetchErr } = await supabase
      .from('user_trades')
      .select('*')
      .in('status', ['active', 'tp1_hit']);

    if (fetchErr) throw fetchErr;
    if (!trades || trades.length === 0) {
      return NextResponse.json({ processed: 0, msg: 'No active trades to track' });
    }

    let processedCount = 0;

    for (const t of trades) {
      const symbol = t.symbol;
      
      // Fetch Yahoo Finance Price
      let currentPrice: number | null = null;
      try {
        const queryInterval = '1d';
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.CA?interval=${queryInterval}&range=1d`;
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        };

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          const metaPrice = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (metaPrice) {
            currentPrice = parseFloat(metaPrice);
          }
        }

        // Fallback to without .CA suffix
        if (!currentPrice) {
          const fallbackUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${queryInterval}&range=1d`;
          const resFb = await fetch(fallbackUrl, { headers });
          if (resFb.ok) {
            const dataFb = await resFb.json();
            const metaPriceFb = dataFb?.chart?.result?.[0]?.meta?.regularMarketPrice;
            if (metaPriceFb) {
              currentPrice = parseFloat(metaPriceFb);
            }
          }
        }
      } catch (err) {
        console.error(`Error querying Yahoo for ${symbol}:`, err);
      }

      if (!currentPrice) {
        console.warn(`Skipping trade for ${symbol} due to missing price.`);
        continue;
      }

      const updates: any = {};
      const entryPrice = parseFloat(t.entry_price);
      const shares = parseFloat(t.shares_count);
      const direction = t.direction || 'buy';
      const isBuy = direction === 'buy';

      const tp1 = parseFloat(t.tp1);
      const tp2 = parseFloat(t.tp2);
      const sl = parseFloat(t.sl);

      const calcPnlPct = (exitP: number) => {
        return ((exitP - entryPrice) / entryPrice * 100) * (isBuy ? 1 : -1);
      };

      const calcPnlAmt = (exitP: number, qtyFraction = 1.0) => {
        const pnlPerShare = (exitP - entryPrice) * (isBuy ? 1 : -1);
        return pnlPerShare * shares * qtyFraction;
      };

      if (t.status === 'active') {
        // Trailing SL logic
        if (t.trailing_sl) {
          const pct = parseFloat(t.trailing_pct ?? '2') / 100;
          const newSl = isBuy ? currentPrice * (1 - pct) : currentPrice * (1 + pct);
          const currentSl = parseFloat(t.current_sl || sl);

          if ((isBuy && newSl > currentSl) || (!isBuy && newSl < currentSl)) {
            await supabase
              .from('user_trades')
              .update({ current_sl: newSl })
              .eq('id', t.id);
            t.current_sl = newSl;
          }
        }

        const activeSl = parseFloat(t.current_sl || sl);

        // Check SL
        if ((isBuy && currentPrice <= activeSl) || (!isBuy && currentPrice >= activeSl)) {
          updates.status = 'closed';
          updates.exit_price = currentPrice;
          updates.exit_reason = t.trailing_sl ? 'trailing_sl' : 'sl';
          updates.pnl_percent = Math.round(calcPnlPct(currentPrice) * 100) / 100;
          updates.pnl_amount = Math.round(calcPnlAmt(currentPrice) * 100) / 100;
        }
        // Check TP1
        else if ((isBuy && currentPrice >= tp1) || (!isBuy && currentPrice <= tp1)) {
          updates.status = 'tp1_hit';
          updates.tp1_exit_price = currentPrice;
          updates.tp1_hit = true;
        }
      } else if (t.status === 'tp1_hit') {
        // Trailing SL to Entry logic
        if ((isBuy && currentPrice <= entryPrice) || (!isBuy && currentPrice >= entryPrice)) {
          updates.status = 'closed';
          updates.exit_price = entryPrice;
          updates.exit_reason = 'trailing_sl';

          const tp1ExitP = parseFloat(t.tp1_exit_price || tp1);
          const tp1PnlPct = calcPnlPct(tp1ExitP);
          updates.pnl_percent = Math.round((0.5 * tp1PnlPct) * 100) / 100;
          updates.pnl_amount = Math.round((calcPnlAmt(tp1ExitP, 0.5) + calcPnlAmt(entryPrice, 0.5)) * 100) / 100;
        }
        // Check TP2
        else if ((isBuy && currentPrice >= tp2) || (!isBuy && currentPrice <= tp2)) {
          updates.status = 'closed';
          updates.exit_price = currentPrice;
          updates.exit_reason = 'tp2';

          const tp1ExitP = parseFloat(t.tp1_exit_price || tp1);
          const tp1PnlPct = calcPnlPct(tp1ExitP);
          const tp2PnlPct = calcPnlPct(currentPrice);
          updates.pnl_percent = Math.round((0.5 * tp1PnlPct + 0.5 * tp2PnlPct) * 100) / 100;
          updates.pnl_amount = Math.round((calcPnlAmt(tp1ExitP, 0.5) + calcPnlAmt(currentPrice, 0.5)) * 100) / 100;
        }
      }

      if (Object.keys(updates).length > 0) {
        if (updates.status === 'closed') {
          updates.closed_at = new Date().toISOString();
        }

        // Apply DB updates
        await supabase
          .from('user_trades')
          .update(updates)
          .eq('id', t.id);

        processedCount++;

        // Dispatch alerts inside server (Telegram, Email, Push)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // 1. Dispatch Web Push
        try {
          let pushTitle = '';
          let pushBody = '';

          if (updates.status === 'tp1_hit') {
            pushTitle = `🎯 ${t.symbol} — الهدف الأول!`;
            pushBody = `السعر وصل لـ ${currentPrice.toFixed(2)} EGP`;
          } else if (updates.exit_reason === 'trailing_sl' || updates.exit_reason === 'sl') {
            pushTitle = `⚠️ ${t.symbol} — الوقف تفعّل`;
            pushBody = `السعر ضرب الوقف عند ${currentPrice.toFixed(2)} EGP`;
          } else if (updates.exit_reason === 'tp2') {
            pushTitle = `🏆 ${t.symbol} — الهدف الثاني!`;
            pushBody = `السعر وصل للهدف الثاني عند ${currentPrice.toFixed(2)} EGP`;
          }

          if (pushTitle) {
            await fetch(`${appUrl}/api/push/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: t.user_id,
                title: pushTitle,
                body: pushBody,
                url: '/ar/my-trades'
              })
            });
          }
        } catch (e) {
          console.error('Push dispatch failed:', e);
        }

        // 2. Dispatch Email Alert
        try {
          const emailType = updates.status === 'tp1_hit' ? 'tp1' : updates.exit_reason === 'tp2' ? 'tp2' : 'sl';
          await fetch(`${appUrl}/api/email/trade-alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: t.user_id,
              type: emailType,
              symbol: t.symbol,
              price: currentPrice,
              pnl: updates.pnl_percent
            })
          });
        } catch (e) {
          console.error('Email dispatch failed:', e);
        }

        // 3. Dispatch Telegram
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          try {
            const { data: tgData } = await supabase
              .from('user_telegram')
              .select('chat_id')
              .eq('user_id', t.user_id)
              .eq('verified', true)
              .maybeSingle();

            if (tgData?.chat_id) {
              let msg = '';
              if (updates.status === 'tp1_hit') {
                msg = `🎯 <b>الهدف الأول TP1 - ${t.symbol}</b>\n\n✅ السعر وصل لـ <b>{price:.2f} EGP</b>\n💰 جني 50% من الكمية الآن\n\n<i>الهدف الثاني: ${t.tp2} EGP</i>`;
              } else if (updates.exit_reason === 'sl') {
                msg = `🚨 <b>وقف الخسارة - ${t.symbol}</b>\n\n⚠️ السعر ضرب الوقف عند <b>{price:.2f} EGP</b>\n📉 الخسارة: ${updates.pnl_percent}%\n\n<i>لا بأس، الإدارة الصحيحة تحمي رأس المال</i>`;
              } else if (updates.exit_reason === 'tp2') {
                msg = `🏆 <b>الهدف الثاني TP2 - ${t.symbol}</b>\n\n💰 ربح كامل: <b>+${updates.pnl_percent}%</b>\n🎉 صفقة ناجحة بالكامل!\n\n<i>TRADEORA يهنئك بهذا الربح</i>`;
              }

              if (msg) {
                msg = msg.replace('{price:.2f}', currentPrice.toFixed(2));
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: tgData.chat_id,
                    text: msg,
                    parse_mode: 'HTML'
                  })
                });
              }
            }
          } catch (e) {
            console.error('Telegram dispatch failed:', e);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error: any) {
    console.error('Subevent cron execution failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
