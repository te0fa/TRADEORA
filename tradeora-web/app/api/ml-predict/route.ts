import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { features, interval } = await req.json();

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const tf = ['15m', '30m'].includes(interval)
      ? '15m'
      : ['1h'].includes(interval)
      ? '1h'
      : ['4h'].includes(interval)
      ? '4h'
      : '1d';

    const { stdout } = await execAsync(
      `python E:\\TRADEORA\\predict.py ${tf} ${features}`
    );
    const prob = parseFloat(stdout.trim());
    return NextResponse.json({ probability: prob });
  } catch (error) {
    console.error('ML Prediction error:', error);
    return NextResponse.json(
      { probability: null },
      { status: 500 }
    );
  }
}
