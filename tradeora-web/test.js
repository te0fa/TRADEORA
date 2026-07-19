const fs = require('fs');

async function scrapeMubasher(symbol) {
  try {
    const res = await fetch(`https://english.mubasher.info/markets/EGX/stocks/${symbol}`);
    if (!res.ok) return null;
    const html = await res.text();
    
    const priceMatch = html.match(/class="market-summary__last-price[^"]*">\s*([\d.]+)/);
    const changeMatch = html.match(/class="market-summary__change-percentage[^"]*">\s*([-\d.%+]+)/);
    
    if (priceMatch && changeMatch) {
      const price = parseFloat(priceMatch[1]);
      const changeStr = changeMatch[1].replace('%', '');
      const change = parseFloat(changeStr);
      return { symbol, price, change };
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function run() {
  const tmgh = await scrapeMubasher('TMGH');
  const hrho = await scrapeMubasher('HRHO');
  console.log('TMGH:', tmgh);
  console.log('HRHO:', hrho);
}
run();
