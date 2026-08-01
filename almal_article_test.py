"""Read AlMal articles from تعاملات section and extract investor flow numbers"""
import httpx, re
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,*/*',
    'Accept-Language': 'ar,en;q=0.9',
}

INVESTOR_KW = ['أجانب', 'مؤسسات', 'أفراد', 'صافي', 'شراء', 'بيع', 'مليون', 'مليار']

def get_article_links(category_url):
    """Get list of article links from category page."""
    r = httpx.get(category_url, headers=headers, timeout=15, follow_redirects=True)
    soup = BeautifulSoup(r.text, 'html.parser')
    links = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.get_text().strip()
        # Article links have numeric IDs
        if re.match(r'/\d+/', href) and text:
            full_url = 'https://almalnews.com' + href if href.startswith('/') else href
            if full_url not in links:
                links.append((text[:60], full_url))
    return links[:10]

def extract_numbers_from_article(url):
    """Fetch article and extract investor flow numbers."""
    try:
        r = httpx.get(url, headers=headers, timeout=15, follow_redirects=True)
        soup = BeautifulSoup(r.text, 'html.parser')

        # Get article body
        article_body = soup.find('div', class_=re.compile(r'article|content|body', re.I))
        if not article_body:
            article_body = soup.find('article') or soup

        text = article_body.get_text(separator='\n', strip=True)

        print(f"\nArticle text ({len(text)} chars):")
        print("─" * 50)

        # Show lines containing investor keywords
        investor_lines = []
        for line in text.split('\n'):
            if any(k in line for k in INVESTOR_KW):
                print(f"  ► {line.strip()}")
                investor_lines.append(line.strip())

        # Extract numbers with context
        print("\nNumbers with context:")
        number_pattern = r'([\d,،\.]+)\s*(مليون|مليار)?\s*جنيه'
        for m in re.finditer(number_pattern, text):
            start = max(0, m.start() - 80)
            end   = min(len(text), m.end() + 40)
            context = text[start:end].replace('\n', ' ')
            print(f"  {m.group()} ← ...{context}...")

        return investor_lines

    except Exception as e:
        print(f"Error reading article: {e}")
        return []

# Step 1: Get articles from تعاملات category
print("=== AlMal تعاملات Category ===")
links = get_article_links('https://almalnews.com/category/بورصة/تعاملات/')
print(f"Found {len(links)} articles:")
for title, url in links:
    print(f"  • {title} → {url}")

# Step 2: Read most recent article
if links:
    print(f"\n=== Reading Latest Article ===")
    print(f"URL: {links[0][1]}")
    extract_numbers_from_article(links[0][1])

    # Also check the market summary article
    for title, url in links:
        if any(k in title for k in ['البورصة', 'مؤشر', 'تعاملات', 'أجانب']):
            print(f"\n=== Reading: {title} ===")
            lines = extract_numbers_from_article(url)
            if lines:
                print(f"\n✅ Found {len(lines)} investor-related lines!")
            break
