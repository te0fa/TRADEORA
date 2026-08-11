import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { normalizeEgxSector } from '@/lib/egx-sectors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sectorMap: Record<string, {
      sector_name: string;
      total: number;
      rising: number;
      falling: number;
      unchanged: number;
      avgChangePct: number;
      totalVolume: number;
      changes: number[];
      topGainer?: { symbol: string; change: number };
      topLoser?: { symbol: string; change: number };
    }> = {};

    // 1. Primary DB Query via CockroachDB / PostgreSQL Pool
    if (process.env.DATABASE_URL) {
      try {
        const { rows } = await pool.query(`
          WITH latest_canonical AS (
            SELECT DISTINCT ON (c.id) 
              c.id, c.symbol, c.name_ar, c.sector,
              COALESCE(mp.change_percent, CASE WHEN mp.open_price > 0 THEN ((mp.close_price - mp.open_price)/mp.open_price)*100 ELSE 0 END) as change_pct,
              COALESCE(mp.volume, 0) as volume,
              mp.close_price
            FROM companies c
            LEFT JOIN market_prices mp ON c.id = mp.company_id
            WHERE mp.close_price > 0 OR mp.close_price IS NULL
            ORDER BY c.id, mp.price_date DESC
          )
          SELECT * FROM latest_canonical;
        `);

        for (const row of rows) {
          const rawSector = row.sector || 'عام';
          const sectorName = normalizeEgxSector(rawSector) || rawSector;
          const chg = parseFloat(row.change_pct || '0');
          const vol = parseFloat(row.volume || '0');
          const sym = row.symbol;

          if (!sectorMap[sectorName]) {
            sectorMap[sectorName] = {
              sector_name: sectorName,
              total: 0,
              rising: 0,
              falling: 0,
              unchanged: 0,
              avgChangePct: 0,
              totalVolume: 0,
              changes: [],
            };
          }

          const sec = sectorMap[sectorName];
          sec.total += 1;
          sec.totalVolume += vol;
          sec.changes.push(chg);

          if (chg > 0) sec.rising += 1;
          else if (chg < 0) sec.falling += 1;
          else sec.unchanged += 1;

          if (!sec.topGainer || chg > sec.topGainer.change) {
            sec.topGainer = { symbol: sym, change: Number(chg.toFixed(2)) };
          }
          if (!sec.topLoser || chg < sec.topLoser.change) {
            sec.topLoser = { symbol: sym, change: Number(chg.toFixed(2)) };
          }
        }
      } catch (dbErr) {
        console.error('CockroachDB query in sectors API error:', dbErr);
      }
    }

    // 2. Supabase Fallback Query if CockroachDB was unavailable or returned empty
    if (Object.keys(sectorMap).length === 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, symbol, name_ar, sector');

      const { data: prices } = await supabase
        .from('market_prices')
        .select('company_id, open_price, close_price, volume, change_percent')
        .order('price_date', { ascending: false })
        .limit(1000);

      const priceMap: Record<string, any> = {};
      for (const p of prices || []) {
        if (!priceMap[p.company_id]) {
          priceMap[p.company_id] = p;
        }
      }

      for (const co of companies || []) {
        const sectorName = normalizeEgxSector(co.sector) || co.sector || 'عام';
        const p = priceMap[co.id];
        const open = p?.open_price ? Number(p.open_price) : 0;
        const close = p?.close_price ? Number(p.close_price) : 0;
        const vol = p?.volume ? Number(p.volume) : 0;
        const rawChg = p?.change_percent != null ? Number(p.change_percent) : 0;

        let chg = rawChg !== 0 ? rawChg : (open > 0 && close > 0 ? Number((((close - open) / open) * 100).toFixed(2)) : 0);

        if (!sectorMap[sectorName]) {
          sectorMap[sectorName] = {
            sector_name: sectorName,
            total: 0,
            rising: 0,
            falling: 0,
            unchanged: 0,
            avgChangePct: 0,
            totalVolume: 0,
            changes: [],
          };
        }

        const sec = sectorMap[sectorName];
        sec.total += 1;
        sec.totalVolume += vol;
        sec.changes.push(chg);

        if (chg > 0) sec.rising += 1;
        else if (chg < 0) sec.falling += 1;
        else sec.unchanged += 1;

        if (!sec.topGainer || chg > sec.topGainer.change) {
          sec.topGainer = { symbol: co.symbol, change: Number(chg.toFixed(2)) };
        }
        if (!sec.topLoser || chg < sec.topLoser.change) {
          sec.topLoser = { symbol: co.symbol, change: Number(chg.toFixed(2)) };
        }
      }
    }

    const result = Object.values(sectorMap).map(sec => {
      const avg = sec.changes.length > 0 ? sec.changes.reduce((a, b) => a + b, 0) / sec.changes.length : 0;
      return {
        ...sec,
        avgChangePct: Number(avg.toFixed(2))
      };
    }).sort((a, b) => b.avgChangePct - a.avgChangePct);

    return NextResponse.json({
      success: true,
      sectors: result
    });
  } catch (err: any) {
    console.error('Sectors performance API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
