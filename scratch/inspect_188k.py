import re
from bs4 import BeautifulSoup

with open("scratch/page_188k.html", "r", encoding="utf-8") as f:
    html = f.read()

print("HTML length:", len(html))
print("Title:", re.findall(r'<title>(.*?)</title>', html, re.IGNORECASE))
print("Iframes:", re.findall(r'<iframe[^>]*src="([^"]*)"', html, re.IGNORECASE))
print("Tables count:", len(re.findall(r'<table', html, re.IGNORECASE)))
print("Spans count:", len(re.findall(r'<span', html, re.IGNORECASE)))

soup = BeautifulSoup(html, "lxml")
text = soup.get_text()
print("Clean text length:", len(text))
print("Clean text snippet (first 1000 chars):")
print(text[:1000])

# Print all script src URLs
scripts = [s.get('src') for s in soup.find_all('script') if s.get('src')]
print("\nScript sources:")
for sc in scripts:
    print(" ", sc)
