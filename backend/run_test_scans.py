"""Führt Test-Scans für 5 Firmen durch."""
import time
import httpx

API = "http://localhost:8000/api/v1"
TIMEOUT = httpx.Timeout(600.0, connect=10.0)

COMPANIES = [
    {"name": "Hornetsecurity", "domain": "hornetsecurity.com", "description": "E-Mail Security", "location": "Hannover"},
    {"name": "Enginsight", "domain": "enginsight.com", "description": "Cybersecurity Plattform fuer KMU", "location": "Jena"},
    {"name": "DriveLock", "domain": "drivelock.com", "description": "Endpoint Security", "location": "Muenchen"},
    {"name": "secunet", "domain": "secunet.com", "description": "Netzwerksicherheit", "location": "Essen"},
    {"name": "G DATA", "domain": "gdata.de", "description": "Antivirus Endpoint Security", "location": "Bochum"},
]


def main():
    client = httpx.Client(timeout=TIMEOUT)

    for i, comp in enumerate(COMPANIES, 1):
        print(f"\n[{i}/5] {comp['name']}")
        print("-" * 40)

        # Company erstellen (skip wenn existiert)
        r = client.post(f"{API}/companies/", json={**comp, "industry_id": "cybersecurity"})
        if r.status_code == 201:
            company_id = r.json()["id"]
        elif r.status_code == 400:
            # Existiert schon - per Liste finden
            r2 = client.get(f"{API}/companies/", params={"industry_id": "cybersecurity"})
            found = [c for c in r2.json() if c["domain"] == comp["domain"]]
            if found:
                company_id = found[0]["id"]
            else:
                print(f"  SKIP: Konnte Company nicht finden")
                continue
        else:
            print(f"  SKIP: Fehler {r.status_code}")
            continue

        # Scan erstellen
        r = client.post(f"{API}/scans/", json={"company_id": company_id, "industry_id": "cybersecurity"})
        scan_id = r.json()["id"]

        # Scan starten
        start = time.time()
        print(f"  Scanning... (10 Queries × 3 Plattformen)")

        try:
            r = client.post(f"{API}/scans/{scan_id}/run")
            elapsed = time.time() - start

            if r.status_code == 200:
                d = r.json()
                print(f"  Done in {elapsed:.0f}s | Score: {d['overall_score']}")
                if d.get("platform_scores"):
                    for p, s in d["platform_scores"].items():
                        print(f"    {p}: {s:.1f}")
                if d.get("recommendations"):
                    print(f"  {len(d['recommendations'])} Empfehlungen")
            else:
                print(f"  FEHLER {r.status_code}: {r.text[:150]}")
        except Exception as e:
            elapsed = time.time() - start
            print(f"  FEHLER nach {elapsed:.0f}s: {e}")

    # Ranking
    print(f"\n{'='*40}")
    print("RANKING Cybersecurity DACH")
    print(f"{'='*40}")
    r = client.get(f"{API}/rankings/cybersecurity")
    if r.status_code == 200:
        ranking = r.json()
        for entry in ranking.get("entries", []):
            print(f"  #{entry['rank']} {entry['company_name']}: {entry['overall_score']:.1f}")
    else:
        print(f"  Fehler: {r.status_code}")

    client.close()


if __name__ == "__main__":
    main()
