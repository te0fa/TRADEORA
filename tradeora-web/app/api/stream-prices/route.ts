import { NextRequest } from 'next/server';
import { livePriceStore, LivePriceTick } from '@/lib/live-price-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const targetSymbol = searchParams.get('symbol')?.toUpperCase();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to send SSE data chunk
  const sendEvent = async (event: string, data: any) => {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
    } catch {
      // Client disconnected
    }
  };

  // Send initial tick data immediately if available
  if (targetSymbol) {
    const existing = livePriceStore.getTick(targetSymbol);
    if (existing) {
      sendEvent('tick', existing);
    }
  } else {
    const allTicks = livePriceStore.getAllTicks();
    if (allTicks.length > 0) {
      sendEvent('all_ticks', allTicks);
    }
  }

  // Subscribe to live price store updates
  const unsubscribe = livePriceStore.subscribe((tick: LivePriceTick) => {
    if (!targetSymbol || tick.symbol === targetSymbol) {
      sendEvent('tick', tick);
    }
  });

  // Keep-alive heartbeat interval (every 15s)
  const heartbeat = setInterval(() => {
    sendEvent('ping', { time: Date.now() });
  }, 15000);

  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeat);
    unsubscribe();
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
