const ticker = 'INFI.CA';
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1wk&range=10y`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    const chart = data.chart.result[0];
    const highs = chart.indicators.quote[0].high;
    const timestamps = chart.timestamp;
    
    let max = 0;
    let maxIdx = -1;
    
    highs.forEach((h, i) => {
      if (h > max) { max = h; maxIdx = i; }
    });
    
    console.log(`Max price for ${ticker}: ${max}`);
    console.log(`Date of Max: ${new Date(timestamps[maxIdx] * 1000).toISOString()}`);
  });
