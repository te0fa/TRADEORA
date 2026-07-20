describe('Financial Formulas', () => {
  it('change% uses previous_close not open_price', async () => {
    const res = await fetch('/api/screener');
    const data = await res.json();
    const stock = data.stocks[0];
    // التحقق: change مش = (price - open) / open
    const intradayChange = (stock.price - stock.open) / stock.open * 100;
    expect(Math.abs(stock.change - intradayChange)).toBeGreaterThan(0.01);
  });
  
  it('OHLC values are not null', async () => {
    const res = await fetch('/api/stock/COMI');
    const data = await res.json();
    expect(data.open_price).not.toBeNull();
    expect(data.high_price).not.toBeNull();
    expect(data.low_price).not.toBeNull();
  });
  
  it('no hardcoded EGX30 value', async () => {
    const res = await fetch('/');
    const html = await res.text();
    expect(html).not.toContain('30450');
  });
  
  it('no Math.random in AI score', () => {
    const pageSource = require('fs').readFileSync('app/[locale]/page.tsx', 'utf8');
    expect(pageSource).not.toContain('Math.random');
  });
  
  it('RSI 40 scores as neutral or bearish', () => {
    const { calcTFSignal } = require('../lib/ta-utils');
    const signal = calcTFSignal({ rsi: 40 });
    expect(signal).toBeLessThanOrEqual(0);
  });
});
