"""Import Cybersecurity-Firmen aus CSV in die Datenbank."""
import csv
import json
import sys
from urllib.parse import urlparse

import httpx

API_URL = "http://localhost:8000/api/v1/companies/import"
CSV_PATH = sys.argv[1] if len(sys.argv) > 1 else "/Users/Kevin/Documents/Coding/painpoint-researches/cybersecurity_leads_500_komplett.csv"
INDUSTRY_ID = "cybersecurity"


def extract_domain(website: str) -> str:
    """Extrahiert Domain aus URL."""
    if not website:
        return ""
    website = website.strip()
    if not website.startswith("http"):
        website = "https://" + website
    parsed = urlparse(website)
    domain = parsed.netloc or parsed.path
    domain = domain.replace("www.", "")
    return domain


def main():
    companies = []
    seen_domains = set()

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            domain = extract_domain(row.get("Website", ""))
            if not domain or domain in seen_domains:
                continue
            seen_domains.add(domain)

            companies.append({
                "name": row.get("Unternehmen", "").strip(),
                "domain": domain,
                "description": row.get("Spezialisierung", "").strip() or None,
                "location": row.get("Standort", "").strip() or None,
                "website_url": row.get("Website", "").strip() or None,
            })

    print(f"{len(companies)} einzigartige Firmen aus CSV gelesen")

    # Bulk-Import via API
    response = httpx.post(
        API_URL,
        params={"industry_id": INDUSTRY_ID},
        json=companies,
        timeout=30.0,
    )

    if response.status_code == 201:
        created = response.json()
        print(f"{len(created)} Firmen importiert!")
    else:
        print(f"Fehler: {response.status_code}")
        print(response.text)


if __name__ == "__main__":
    main()
