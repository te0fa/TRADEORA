import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendTradeAlert } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { user_id, type, symbol, price, pnl } = await req.json();

    const { data: userData } = await supabase.auth.admin.getUserById(user_id);
    const { data: profile  } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user_id)
      .maybeSingle();

    if (!userData?.user?.email) {
      return NextResponse.json({ error: 'no email' }, { status: 400 });
    }

    await sendTradeAlert(
      userData.user.email,
      profile?.full_name ?? 'عميلنا العزيز',
      type,
      symbol,
      price,
      pnl
    );

    return NextResponse.json({ sent: true });
  } catch (error: any) {
    console.error('Error dispatching trade alert email:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
