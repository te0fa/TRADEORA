const url = 'https://scanner.tradingview.com/egypt/scan';
const payload = {
  symbols: { tickers: ['EGX:INFI'] },
  columns: [
    'name', 'close', 'market_cap_basic', 'price_earnings_ttm',
    'earnings_per_share_basic_ttm', 'dividend_yield_recent',
    'expected_annual_dividends', 'dividends_yield',
    'price_book_ratio', 'price_sales_current',
    'sector', 'industry'
  ]
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0'
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
