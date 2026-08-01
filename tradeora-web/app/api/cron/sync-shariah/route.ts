import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OFFICIAL_EGX33_SHARIAH_SYMBOLS } from '@/lib/shariah-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  try {
    const sb = getSb();
    if (!sb) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    // Verify secret if provided (for Cron authorization)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch companies
    const { data: companies, error: compErr } = await sb
      .from('companies')
      .select('id, symbol, is_shariah_compliant, is_egx33_shariah, is_boubyan_compliant, purification_ratio');

    if (compErr || !companies) {
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    let updatedCount = 0;

    for (const co of companies) {
      const sym = (co.symbol || '').toUpperCase();
      const isEgx33 = OFFICIAL_EGX33_SHARIAH_SYMBOLS.has(sym);
      const isBoubyan = Boolean(co.is_shariah_compliant ?? isEgx33);
      const ratio = !co.is_shariah_compliant && !isEgx33 ? 1.5 : 0.0;

      // Update company record in Supabase
      const { error: updateErr } = await sb
        .from('companies')
        .update({
          is_egx33_shariah: isEgx33,
          is_boubyan_compliant: isBoubyan,
          purification_ratio: ratio
        })
        .eq('id', co.id);

      if (!updateErr) updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly Friday Shariah 3-Source Audit sync completed successfully',
      total_companies: companies.length,
      updated_companies: updatedCount,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error in Friday Shariah Cron:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
