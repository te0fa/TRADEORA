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

    // Webhook Idempotency Check: prevent duplicate event processing
    try {
      const { data: existingEvent } = await supabase
        .from('processed_stripe_events')
        .select('event_id')
        .eq('event_id', event.id)
        .maybeSingle();

      if (existingEvent) {
        console.log(`Stripe event ${event.id} already processed. Skipping...`);
        return NextResponse.json({ received: true, duplicate: true });
      }

      // Record the event immediately as processed
      await supabase
        .from('processed_stripe_events')
        .insert([{ event_id: event.id, event_type: event.type }]);
    } catch (e) {
      console.error('Error verifying processed Stripe event, aborting to prevent unsafe updates.', e);
      return NextResponse.json({ error: 'Database check failed' }, { status: 500 });
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
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
