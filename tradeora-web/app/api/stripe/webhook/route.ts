import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
    apiVersion: '2025-01-27.acacia' as any
  });
  try {
    const body = await req.text();
    const sig  = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature validation failed:', err.message);
      return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId  = session.metadata?.user_id;
      const customerId = session.customer;

      if (userId) {
        const end = new Date();
        end.setMonth(end.getMonth() + 1);

        await supabase
          .from('user_profiles')
          .update({
            role: 'premium',
            subscription_end: end.toISOString(),
            stripe_customer_id: customerId || null,
          })
          .eq('id', userId);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as any;
      const cusId = sub.customer;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('stripe_customer_id', cusId)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({
            role: 'user',
            subscription_end: null,
          })
          .eq('id', profile.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook payload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
