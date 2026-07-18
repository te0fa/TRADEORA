import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTradeAlert(
  to:     string,
  name:   string,
  type:   'tp1' | 'tp2' | 'sl' | 'price_alert',
  symbol: string,
  price:  number,
  pnl?:   number
) {
  const subjects = {
    tp1:         `🎯 ${symbol} — الهدف الأول محقق!`,
    tp2:         `🏆 ${symbol} — الهدف الثاني محقق!`,
    sl:          `⚠️ ${symbol} — وقف الخسارة`,
    price_alert: `🔔 ${symbol} — وصل لسعرك المستهدف`,
  };

  const colors = {
    tp1: '#22c55e',
    tp2: '#10b981',
    sl:  '#ef4444',
    price_alert: '#3b82f6'
  };

  const messages = {
    tp1: `
      وصل سعر ${symbol} للهدف الأول!
      السعر الحالي: ${price.toFixed(2)} EGP
      ننصحك بجني 50% من الكمية الآن وترك الباقي للهدف الثاني.
    `,
    tp2: `
      🎉 تهانينا! وصل ${symbol} للهدف الثاني!
      السعر: ${price.toFixed(2)} EGP
      الربح: +${pnl?.toFixed(2)}%
    `,
    sl: `
      ضرب سعر ${symbol} مستوى وقف الخسارة.
      السعر: ${price.toFixed(2)} EGP
      الخسارة: ${pnl?.toFixed(2)}%
      إدارة المخاطر الصحيحة تحمي رأس مالك.
    `,
    price_alert: `
      وصل سعر ${symbol} للمستوى الذي حددته!
      السعر الحالي: ${price.toFixed(2)} EGP
    `,
  };

  await resend.emails.send({
    from: `TRADEORA <${process.env.FROM_EMAIL}>`,
    to,
    subject: subjects[type],
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif;
           background: #0D1B2A; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto;
                 background: #111E2E;
                 border-radius: 16px; overflow: hidden;
                 border: 1px solid rgba(201,168,76,0.2); }
    .header { padding: 30px; text-align: center;
              background: linear-gradient(
                135deg, #0D1B2A, #162030); }
    .badge { display: inline-block; padding: 6px 16px;
             border-radius: 20px; font-weight: bold;
             font-size: 14px; margin-bottom: 16px;
             background: ${colors[type]}20;
             color: ${colors[type]};
             border: 1px solid ${colors[type]}40; }
    .symbol { font-size: 32px; font-weight: 900;
              color: #C9A84C; margin: 10px 0; }
    .price { font-size: 24px; color: white;
             font-weight: bold; }
    .body { padding: 30px; color: #94a3b8;
            line-height: 1.8; font-size: 15px; }
    .cta { text-align: center; padding: 20px 30px 30px; }
    .btn { display: inline-block; padding: 14px 32px;
           background: linear-gradient(
             135deg, #C9A84C, #A07830);
           color: #0D1B2A; font-weight: bold;
           text-decoration: none; border-radius: 12px;
           font-size: 16px; }
    .footer { padding: 20px 30px; text-align: center;
              color: #475569; font-size: 12px;
              border-top: 1px solid rgba(255,255,255,0.05); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${subjects[type]}</div>
      <div class="symbol">${symbol}</div>
      <div class="price">${price.toFixed(2)} EGP</div>
    </div>
    <div class="body">
      مرحباً ${name}،
      <br/><br/>
      ${messages[type]}
    </div>
    <div class="cta">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/ar/my-trades"
         class="btn">
        📊 عرض صفقاتي
      </a>
    </div>
    <div class="footer">
      TRADEORA — منصة التحليل الفني للبورصة المصرية
      <br/>
      <small>
        التوصيات لأغراض تعليمية فقط وليست نصيحة استثمارية
      </small>
    </div>
  </div>
</body>
</html>
    `
  });
}
