const ticker = 'INFI.CA';
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1wk&range=10y`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    const chart = data.chart.result[0];
    const quote = chart.indicators.quote[0];
    const adjclose = chart.indicators.adjclose[0].adjclose;
    const highs = quote.high;
    const closes = quote.close;
    const timestamps = chart.timestamp;
    
    let maxHigh = 0;
    let maxIdx = -1;
    
    highs.forEach((h, i) => {
      if (h > maxHigh) { maxHigh = h; maxIdx = i; }
    });
    
    console.log(`Max High: ${maxHigh}`);
    console.log(`Close on that day: ${closes[maxIdx]}`);
    console.log(`AdjClose on that day: ${adjclose[maxIdx]}`);
    console.log(`Date: ${new Date(timestamps[maxIdx] * 1000).toISOString()}`);
    
    // Check recent differences
    const lastIdx = closes.length - 1;
    console.log(`Current Close: ${closes[lastIdx]}, AdjClose: ${adjclose[lastIdx]}`);
  });
