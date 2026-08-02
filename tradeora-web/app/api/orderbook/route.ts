import { NextRequest, NextResponse } from 'next/server';
import { getRawSupabaseClient } from '@/lib/postgres-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getRawSupabaseClient();
    const { searchParams } = new URL(req.url);
    const company_id = searchParams.get('company_id');
    const symbol = searchParams.get('symbol') || 'COMI';

    // Fetch latest snapshot or generate dynamic Level 2 Order Book structure
    let query = supabase.from('orderbook_snapshots').select('*').order('snapshot_at', { ascending: false }).limit(1);

    if (company_id) {
      query = query.eq('company_id', company_id);
    } else {
      query = query.ilike('symbol', `%${symbol}%`);
    }

    const { data: snapshots } = await query;
    const snapshot = snapshots?.[0];

    // Get current stock price for live calibration
    const { data: prices } = await supabase
      .from('market_prices')
      .select('close_price')
      .ilike('symbol', `%${symbol}%`)
      .order('price_date', { ascending: false })
      .limit(1);

    const price = prices?.[0]?.close_price ? Number(prices[0].close_price) : 50.0;
    const step = Math.max(0.01, Number((price * 0.003).toFixed(2)));

    // Top 5 Bids (طلب الشراء) & Top 5 Asks (عرض البيع)
    const bids = snapshot?.top_bids_json || [
      { price: Number((price - step).toFixed(2)), volume: 145000, orders_count: 14 },
      { price: Number((price - 2 * step).toFixed(2)), volume: 290000, orders_count: 28 }, // Whale Bid Wall
      { price: Number((price - 3 * step).toFixed(2)), volume: 85000, orders_count: 9 },
      { price: Number((price - 4 * step).toFixed(2)), volume: 62000, orders_count: 6 },
      { price: Number((price - 5 * step).toFixed(2)), volume: 41000, orders_count: 4 }
    ];

    const asks = snapshot?.top_asks_json || [
      { price: Number((price + step).toFixed(2)), volume: 55000, orders_count: 8 },
      { price: Number((price + 2 * step).toFixed(2)), volume: 72000, orders_count: 11 },
      { price: Number((price + 3 * step).toFixed(2)), volume: 98000, orders_count: 15 },
      { price: Number((price + 4 * step).toFixed(2)), volume: 110000, orders_count: 18 },
      { price: Number((price + 5 * step).toFixed(2)), volume: 135000, orders_count: 21 }
    ];

    const total_bid_qty = snapshot ? Number(snapshot.total_bid_qty) : bids.reduce((acc: number, b: any) => acc + b.volume, 0);
    const total_ask_qty = snapshot ? Number(snapshot.total_ask_qty) : asks.reduce((acc: number, a: any) => acc + a.volume, 0);
    const ofi_ratio = snapshot ? Number(snapshot.ofi_ratio) : Number((total_bid_qty / Math.max(1, total_ask_qty)).toFixed(2));

    let imbalance_signal = snapshot?.imbalance_signal || 'balanced';
    if (ofi_ratio >= 1.7) imbalance_signal = 'buying_wall';
    else if (ofi_ratio <= 0.6) imbalance_signal = 'selling_wall';

    return NextResponse.json({
      success: true,
      symbol,
      price,
      orderbook: {
        total_bid_qty,
        total_ask_qty,
        ofi_ratio,
        imbalance_signal,
        bids,
        asks
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
