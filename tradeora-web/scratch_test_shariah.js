async function fetchMubasherShariah() {
  try {
    const res = await fetch('https://www.mubasher.info/markets/EGX/indices/SHARIAH', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const html = await res.text();
      const priceMatch = html.match(/class="market-summary__last-price[^"]*">\s*([\d,.]+)/);
      const changeMatch = html.match(/class="market-summary__change-percentage[^"]*">\s*([-\d.%+]+)/);
      if (priceMatch && changeMatch) {
        const val = parseFloat(priceMatch[1].replace(/,/g, ''));
        const chg = parseFloat(changeMatch[1].replace('%', ''));
        console.log('Mubasher Shariah direct page:', { val, chg });
        return { value: val, change: chg };
      }
    }
  } catch (e) {
    console.error('Mubasher Shariah direct failed:', e.message);
  }

  // Fallback to Mubasher main markets page
  try {
    const res = await fetch('https://www.mubasher.info/markets/EGX', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    });
    if (res.ok) {
      const html = await res.text();
      const text = html.replace(/<[^>]*>/g, '\n').replace(/\s+/g, ' ');
      const shariahMatch = text.match(/مؤشر الشريعة\s*([\d,.]+)\s*([\d,.+\-]+)\s*([\d,.+\-]+)%/);
      if (shariahMatch) {
        const val = parseFloat(shariahMatch[1].replace(/,/g, ''));
        const chg = parseFloat(shariahMatch[3]);
        console.log('Mubasher EGX summary fallback:', { val, chg });
        return { value: val, change: chg };
      }
    }
  } catch (e) {
    console.error('Mubasher main fallback failed:', e.message);
  }

  return null;
}

fetchMubasherShariah();
