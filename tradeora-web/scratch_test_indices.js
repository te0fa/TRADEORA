const fs = require('fs');

async function testTradingView() {
  const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify({
      symbols: { tickers: ['EGX:EGX30', 'EGX:EGX70EWI', 'EGX:EGX100EWI'] },
      columns: ['name', 'close', 'change', 'change_abs', 'description']
    })
  });
  const data = await res.json();
  console.log('--- TradingView Scanner Results ---');
  data.data.forEach(item => {
    console.log(item.s, '-> Close:', item.d[1], 'Change %:', item.d[2]?.toFixed(2) + '%', 'Change Abs:', item.d[3]);
  });
}

async function testMubasherShariah() {
  try {
    const res = await fetch('https://www.mubasher.info/markets/EGX/indices/SHARIAH', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    const priceMatch = html.match(/class="market-summary__last-price[^"]*">\s*([\d,.]+)/);
    const changeMatch = html.match(/class="market-summary__change-percentage[^"]*">\s*([-\d.%+]+)/);
    console.log('\n--- Mubasher EGX33 Shariah Index ---');
    console.log('Price:', priceMatch ? priceMatch[1] : 'Not found');
    console.log('Change:', changeMatch ? changeMatch[1] : 'Not found');
  } catch (e) {
    console.error('Mubasher error:', e.message);
  }
}

async function main() {
  await testTradingView();
  await testMubasherShariah();
}

main();
