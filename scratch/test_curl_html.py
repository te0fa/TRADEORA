from curl_cffi import requests
import re

session = requests.Session(impersonate="chrome120")

print("1. Fetching Home.aspx...")
r1 = session.get("https://www.egx.com.eg/ar/Home.aspx", timeout=20)
print("Home status:", r1.status_code)

print("2. Fetching InvestorsTypeCharts.aspx...")
r2 = session.get("https://www.egx.com.eg/ar/InvestorsTypeCharts.aspx", timeout=20)
print("InvestorsTypeCharts status:", r2.status_code, "HTML length:", len(r2.text))

with open("scratch/egx_page.html", "w", encoding="utf-8") as f:
    f.write(r2.text)

print("Saved HTML to scratch/egx_page.html")
print("Form action:", re.findall(r'<form[^>]*action="([^"]*)"', r2.text))
print("ViewState:", len(re.findall(r'__VIEWSTATE', r2.text)))
print("Spans with numbers:", re.findall(r'<span[^>]*>[^<]*\d+[^<]*</span>', r2.text)[:10])
