// Hybrid fundamentals fetcher

export async function fetchHybridFundamentals(symbol: string) {
  try {
    // 1. Fetch from TradingView Scanner API
    let tvData = null;
    try {
      const tvSymbol = symbol.startsWith('EGX:') ? symbol : `EGX:${symbol}`;
      const url = 'https://scanner.tradingview.com/egypt/scan';
      const payload = {
        symbols: { tickers: [tvSymbol] },
        columns: [
          'name', 'close', 'market_cap_basic', 'price_earnings_ttm',
          'earnings_per_share_basic_ttm', 'dividend_yield_recent',
          'expected_annual_dividends', 'dividends_yield',
          'price_book_ratio', 'price_sales_current',
          'sector', 'industry'
        ]
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const d = json.data[0].d;
          tvData = {
            price: d[1],
            market_cap: d[2],
            pe_ratio: d[3],
            eps: d[4],
            dividend_yield: d[5] || d[7],
            pb_ratio: d[8],
            sector: d[10],
            industry: d[11]
          };
        }
      }
    } catch (e) {
      console.warn('TradingView fetch failed:', e);
    }

    // 2. Fetch from Mubasher (Scraper)
    let mubasherData = null;
    try {
      const res = await fetch(`https://english.mubasher.info/markets/EGX/stocks/${symbol}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (res.ok) {
        const html = await res.text();
        const priceMatch = html.match(/class="market-summary__last-price[^"]*">\s*([\d.]+)/);
        
        // Mubasher usually has PE and EPS in the fundamentals table.
        // E.g., <td class="fundamentals__value">12.5</td>
        // We can extract them if needed, or rely on our other scrapers.
        const peMatch = html.match(/P\/E.*?([\d.]+)/i); // Simplified regex for example
        
        if (priceMatch) {
          mubasherData = {
            price: parseFloat(priceMatch[1]),
            pe_ratio: peMatch ? parseFloat(peMatch[1]) : null
          };
        }
      }
    } catch (e) {
      console.warn('Mubasher fetch failed:', e);
    }

    // 3. Merge Logic (Priority: TradingView > Mubasher for most, but Mubasher > TV for Egyptian PE/EPS if TV is missing)
    const finalData = {
      market_cap: tvData?.market_cap ?? null,
      pe_ratio: mubasherData?.pe_ratio ?? tvData?.pe_ratio ?? null,
      eps: tvData?.eps ?? null, // Can add Mubasher EPS scraping if needed
      dividend_yield: tvData?.dividend_yield ?? null,
      book_value: null, // calculate from PB
      sector: tvData?.sector ?? null,
    };

    return finalData;

  } catch (error) {
    console.error('Error in fetchHybridFundamentals:', error);
    return null;
  }
}
