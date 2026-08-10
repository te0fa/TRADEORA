import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

export type OrderBookStatus = 'REAL' | 'DERIVED' | 'UNAVAILABLE';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    let company_id = searchParams.get('company_id');
    const symbol = searchParams.get('symbol') || 'COMI';

    // Resolve company_id if missing
    if (!company_id && symbol) {
      const cleanSym = symbol.replace(/\.CA$/i, '').trim();
      const { data: comp } = await supabase
        .from('companies')
        .select('id')
        .or(`symbol.eq.${cleanSym},symbol.eq.${cleanSym}.CA`)
        .limit(1);
      if (comp?.[0]) company_id = comp[0].id;
    }

    // Fetch latest real snapshot from orderbook_snapshots
    let query = supabase
      .from('orderbook_snapshots')
      .select('*')
      .order('snapshot_at', { ascending: false })
      .limit(1);

    if (company_id) {
      query = query.eq('company_id', company_id);
    } else {
      query = query.ilike('symbol', `%${symbol}%`);
    }

    const { data: snapshots } = await query;
    const snapshot = snapshots?.[0];

    // Safely parse top_bids_json and top_asks_json
    let bids: Array<{ price: number; volume: number; orders_count: number }> = [];
    let asks: Array<{ price: number; volume: number; orders_count: number }> = [];

    if (snapshot) {
      try {
        const rawBids = typeof snapshot.top_bids_json === 'string' 
          ? JSON.parse(snapshot.top_bids_json) 
          : snapshot.top_bids_json;
        if (Array.isArray(rawBids)) {
          bids = rawBids.map((b: any) => ({
            price: Number(b.price || 0),
            volume: Number(b.volume || b.qty || 0),
            orders_count: Number(b.orders_count || b.orders || 1)
          })).filter(b => b.price > 0 && b.volume > 0);
        }
      } catch (e) {
        bids = [];
      }

      try {
        const rawAsks = typeof snapshot.top_asks_json === 'string'
          ? JSON.parse(snapshot.top_asks_json)
          : snapshot.top_asks_json;
        if (Array.isArray(rawAsks)) {
          asks = rawAsks.map((a: any) => ({
            price: Number(a.price || 0),
            volume: Number(a.volume || a.qty || 0),
            orders_count: Number(a.orders_count || a.orders || 1)
          })).filter(a => a.price > 0 && a.volume > 0);
        }
      } catch (e) {
        asks = [];
      }
    }

    // Strict Classification: REAL / DERIVED / UNAVAILABLE
    const hasData = bids.length > 0 || asks.length > 0;
    
    if (!hasData) {
      return NextResponse.json({
        success: true,
        symbol,
        data_status: 'UNAVAILABLE',
        available: false,
        is_derived: false,
        message: 'عمق السوق (Level 2) غير متاح لبورصة مصر حالياً لهذه الورقة المالية',
        message_en: 'Level 2 Order Book data is currently unavailable for this EGX equity',
        orderbook: {
          data_status: 'UNAVAILABLE',
          available: false,
          is_derived: false,
          total_bid_qty: 0,
          total_ask_qty: 0,
          ofi_ratio: null,
          imbalance_signal: 'none',
          bids: [],
          asks: [],
          snapshot_at: null
        }
      });
    }

    // Check if flagged as derived or calculated
    const isDerived = Boolean(snapshot?.is_derived || snapshot?.source === 'calculated' || snapshot?.source === 'tick_derived');
    const dataStatus: OrderBookStatus = isDerived ? 'DERIVED' : 'REAL';

    const total_bid_qty = Number(snapshot.total_bid_qty) || bids.reduce((acc, b) => acc + b.volume, 0);
    const total_ask_qty = Number(snapshot.total_ask_qty) || asks.reduce((acc, a) => acc + a.volume, 0);
    const ofi_ratio = total_ask_qty > 0 
      ? Number((total_bid_qty / total_ask_qty).toFixed(2)) 
      : Number(snapshot.ofi_ratio || 1.0);

    let imbalance_signal = snapshot?.imbalance_signal || 'balanced';
    if (ofi_ratio >= 1.7) imbalance_signal = 'buying_wall';
    else if (ofi_ratio <= 0.6) imbalance_signal = 'selling_wall';

    return NextResponse.json({
      success: true,
      symbol,
      data_status: dataStatus,
      available: true,
      is_derived: isDerived,
      source: snapshot?.source || (isDerived ? 'calculated' : 'exchange_snapshot'),
      confidence: isDerived ? (snapshot?.confidence ?? 0.85) : 1.0,
      orderbook: {
        data_status: dataStatus,
        available: true,
        is_derived: isDerived,
        source: snapshot?.source || (isDerived ? 'calculated' : 'exchange_snapshot'),
        confidence: isDerived ? (snapshot?.confidence ?? 0.85) : 1.0,
        total_bid_qty,
        total_ask_qty,
        ofi_ratio,
        imbalance_signal,
        bids,
        asks,
        snapshot_at: snapshot?.snapshot_at || null
      }
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message || 'Internal server error',
      data_status: 'UNAVAILABLE',
      available: false,
      orderbook: {
        data_status: 'UNAVAILABLE',
        available: false,
        bids: [],
        asks: []
      }
    }, { status: 500 });
  }
}
