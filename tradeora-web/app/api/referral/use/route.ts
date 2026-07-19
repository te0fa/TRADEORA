import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { referral_code, new_user_id } = await req.json();

    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, referral_count, referral_months')
      .eq('referral_code', referral_code.toUpperCase())
      .maybeSingle();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: 'كود الإحالة غير صحيح' },
        { status: 404 }
      );
    }

    // Link new user to referrer
    await supabaseAdmin
      .from('user_profiles')
      .update({
        referred_by: referrer.id
      })
      .eq('id', new_user_id);

    // Grant referrer 1 month of premium
    const newCount  = (referrer.referral_count ?? 0) + 1;
    const newMonths = (referrer.referral_months ?? 0) + 1;

    const end = new Date();
    end.setMonth(end.getMonth() + newMonths);

    await supabaseAdmin
      .from('user_profiles')
      .update({
        referral_count:  newCount,
        referral_months: newMonths,
        role:            'premium',
        subscription_end: end.toISOString(),
      })
      .eq('id', referrer.id);

    return NextResponse.json({
      success: true,
      message: 'تم تطبيق كود الإحالة ✅'
    });
  } catch (error: any) {
    console.error('Referral application error:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
