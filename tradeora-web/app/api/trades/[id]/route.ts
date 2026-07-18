import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PATCH: Update a trade's status/exit info
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      status,
      exit_reason,
      exit_price,
      pnl_percent,
      closed_at
    } = body;

    // Check if trade exists
    const { data: existingTrade, error: fetchError } = await supabase
      .from('recommended_trades')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (exit_reason !== undefined) updates.exit_reason = exit_reason;
    if (exit_price !== undefined) updates.exit_price = parseFloat(exit_price);
    if (pnl_percent !== undefined) updates.pnl_percent = parseFloat(pnl_percent);
    
    if (status === 'closed') {
      updates.closed_at = closed_at || new Date().toISOString();
    } else if (closed_at !== undefined) {
      updates.closed_at = closed_at;
    }

    const { data: updatedTrade, error: updateError } = await supabase
      .from('recommended_trades')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, trade: updatedTrade });
  } catch (error: any) {
    console.error('Error in PATCH /api/trades/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
