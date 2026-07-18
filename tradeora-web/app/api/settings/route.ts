import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch system settings for risk management
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'risk_management')
      .maybeSingle();

    if (error) {
      throw error;
    }

    // Default settings if table is empty or record doesn't exist yet
    const defaultSettings = {
      trailing_stop_to_entry: true,
      min_risk_reward: 1.5,
      min_ml_probability: 0.58,
      require_volume_spike: true
    };

    const settings = data ? data.value : defaultSettings;

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST/PATCH: Update system settings for risk management
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Sanitize and validate inputs
    const updatedSettings = {
      trailing_stop_to_entry: typeof body.trailing_stop_to_entry === 'boolean' ? body.trailing_stop_to_entry : true,
      min_risk_reward: typeof body.min_risk_reward === 'number' ? body.min_risk_reward : 1.5,
      min_ml_probability: typeof body.min_ml_probability === 'number' ? body.min_ml_probability : 0.58,
      require_volume_spike: typeof body.require_volume_spike === 'boolean' ? body.require_volume_spike : true
    };

    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'risk_management',
        value: updatedSettings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, settings: data.value });
  } catch (error: any) {
    console.error('Error in POST /api/settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
