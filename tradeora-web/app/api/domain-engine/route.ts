import { NextRequest, NextResponse } from 'next/server';
import { 
  TechnicalIndicatorEvaluator, 
  TradeRiskLevelsEvaluator, 
  MarketDataEvaluator, 
  Money 
} from '@/lib/domain';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'calculate_pivot_points': {
        const { high, low, close } = payload;
        if (!high || !low || !close) {
          return NextResponse.json({ error: 'high, low, and close are required' }, { status: 400 });
        }
        const pivots = TradeRiskLevelsEvaluator.calculatePivotPoints(
          String(high), 
          String(low), 
          String(close)
        );
        return NextResponse.json({ success: true, data: pivots });
      }

      case 'calculate_risk_plan': {
        const { currentPrice, high, low, close } = payload;
        if (!currentPrice || !high || !low || !close) {
          return NextResponse.json({ error: 'currentPrice, high, low, and close are required' }, { status: 400 });
        }
        const riskPlan = TradeRiskLevelsEvaluator.calculateRiskRewardPlan(
          String(currentPrice),
          String(high),
          String(low),
          String(close)
        );
        return NextResponse.json({ success: true, data: riskPlan });
      }

      case 'calculate_rsi': {
        const { prices, period = 14 } = payload;
        if (!prices || !Array.isArray(prices) || prices.length === 0) {
          return NextResponse.json({ error: 'prices array is required' }, { status: 400 });
        }
        const rsiDec = TechnicalIndicatorEvaluator.calculateRSI(prices, period);
        return NextResponse.json({ success: true, rsi: rsiDec.toFixed(2) });
      }

      case 'calculate_macd': {
        const { prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = payload;
        if (!prices || !Array.isArray(prices)) {
          return NextResponse.json({ error: 'prices array is required' }, { status: 400 });
        }
        const macd = TechnicalIndicatorEvaluator.calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);
        return NextResponse.json({
          success: true,
          data: {
            macdLine: macd.macdLine.toFixed(4),
            signalLine: macd.signalLine.toFixed(4),
            histogram: macd.histogram.toFixed(4)
          }
        });
      }

      case 'check_circuit_breaker': {
        const { currentPrice, referencePrice } = payload;
        if (!currentPrice || !referencePrice) {
          return NextResponse.json({ error: 'currentPrice and referencePrice are required' }, { status: 400 });
        }
        const status = MarketDataEvaluator.calculateCircuitBreakerStatus(
          String(currentPrice),
          String(referencePrice)
        );
        return NextResponse.json({ success: true, circuitBreakerStatus: status });
      }

      case 'check_egx_session': {
        const isSessionActive = MarketDataEvaluator.isEGXSessionActive();
        return NextResponse.json({ success: true, isSessionActive });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Domain Engine API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal domain computation error' }, { status: 500 });
  }
}
