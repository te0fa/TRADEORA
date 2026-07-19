import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
    apiVersion: '2025-01-27.acacia' as any
  });
  try {
    const { user_id, email } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: 'price_1Qd1EGX30PremiumPlaceholder', // Fallback Price ID setup from Stripe Dashboard
        quantity: 1,
      }],
      customer_email: email,
      metadata: { user_id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ar/settings?upgraded=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ar/settings`,
      locale: 'ar' as any,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
