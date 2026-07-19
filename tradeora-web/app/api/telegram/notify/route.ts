import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN is not configured on the server.' }, 
        { status: 500 }
      );
    }

    const { chat_id, message } = await req.json();
    if (!chat_id || !message) {
      return NextResponse.json(
        { error: 'missing params: chat_id and message are required.' }, 
        { status: 400 }
      );
    }

    const res = await fetch(`${TG_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: message,
        parse_mode: 'HTML',
      })
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error sending Telegram notification:', error);
    return NextResponse.json(
      { error: 'حدث خطأ، حاول مرة أخرى' }, 
      { status: 500 }
    );
  }
}
