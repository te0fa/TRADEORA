import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { livePriceStore } from '@/lib/live-price-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, price, changePct, high, low, volume } = body;

    if (!symbol || price === undefined) {
      return NextResponse.json({ success: false, error: 'Symbol and price are required' }, { status: 400 });
    }

    // Update in-memory live price store for instant 1ms streaming
    livePriceStore.updateTick(symbol, {
      price: Number(price),
      changePct: changePct !== undefined ? Number(changePct) : undefined,
      high: high !== undefined ? Number(high) : undefined,
      low: low !== undefined ? Number(low) : undefined,
      volume: volume !== undefined ? Number(volume) : undefined
    });

    return NextResponse.json({ success: true, symbol, price });
  } catch (err: any) {
    console.error('Error updating live tick:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
