# Design: Deterministisches Query-System

**Datum:** 2026-02-17
**Status:** Entwurf
**Ansatz:** Pre-compiled Query Sets (Ansatz B)

---

## 1. Problemanalyse

### Aktueller Zustand

Der `QueryGenerator` erzeugt Queries dynamisch aus Templates + Zufallswerten:

```
Template: "Beste Anbieter für {service} in {region}"
      ↓ random.choice(services) → "Cloud Security"
      ↓ random.choice(regions)  → "Bayern"
Ergebnis: "Beste Anbieter für Cloud Security in Bayern"
```

### Probleme

| Problem | Auswirkung | Schwere |
|---------|-----------|---------|
| `random.choice()` ohne Seed | Jeder Scan bekommt andere Queries → Scores nicht vergleichbar | Kritisch |
| `random.shuffle()` auf Ergebnisliste | Reihenfolge variiert → LLM-Antworten können reihenfolgeabhängig sein | Mittel |
| `total: 10` bei 50 Templates | Nur 20% der Templates werden genutzt, zufälliges Subset | Hoch |
| Template-Platzhalter erzeugen Kombinationsexplosion | 8 Templates × 15 Services × 7 Regions = 840 mögliche Queries, aber nur 10 werden gewählt | Hoch |
| Kein Versionsmanagement | Query-Änderungen entwerten alle bisherigen Scans retroaktiv | Mittel |

### Konkretes Beispiel — unfairer Vergleich

Scan von Firma A (Seed-Zufall ergibt):
- "Beste Anbieter für **Penetration Testing** in **Bayern**"
- "Wie schütze ich mein Unternehmen vor **Ransomware**?"

Scan von Firma B (anderer Zufall):
- "Beste Anbieter für **OT Security** in **Schweiz**"
- "Wie schütze ich mein Unternehmen vor **Insider-Bedrohungen**?"

→ Firma A wird auf Penetration Testing geprüft, Firma B auf OT Security. Die Scores sind **nicht vergleichbar**, weil verschiedene Fragen gestellt wurden.

---

## 2. Design: Pre-compiled Query Sets

### Kernprinzip

Queries werden **manuell kuratiert** und als **fester Satz** in der Industry-YAML gespeichert. Keine Templates, kein Random, keine Platzhalter — außer `{company_name}` in Brand-Queries.

### Zwei Query-Pools

| Pool | Anteil | Platzhalter | Zweck |
|------|--------|-------------|-------|
| **generic** | ~80% | Keine | Identisch für alle Firmen. Misst, ob die KI eine Firma von sich aus empfiehlt. |
| **brand** | ~20% | `{company_name}` | Firmenname wird eingesetzt. Misst, wie die KI die Firma direkt bewertet. |

### Warum diese Aufteilung?

- **Generic Queries** sind der faire Vergleichskern: "Welche Cybersecurity-Anbieter empfiehlst du für den Mittelstand?" — hier wird die Firma entweder genannt oder nicht. Das ist die eigentliche "KI-Sichtbarkeit".
- **Brand Queries** messen Reputation: "Ist CrowdStrike ein guter Anbieter?" — hier geht es um Sentiment und Kontext, nicht um Sichtbarkeit. Trotzdem wertvoll für die Analyse.

---

## 3. Neue YAML-Struktur

```yaml
id: cybersecurity
name: "Cybersecurity"
display_name: "KI-Sichtbarkeit: Cybersecurity DACH"
description: "Cybersecurity-Unternehmen im DACH-Raum"
language: de
region: DACH

platforms:
  chatgpt:
    weight: 0.35
    model: "gpt-4o"
  claude:
    weight: 0.35
    model: "claude-sonnet-4-5-20250929"
  gemini:
    weight: 0.30
    model: "gemini-2.0-flash"

scoring:
  mention_types:
    direct_recommendation: 1.0
    listed_among_top: 0.8
    mentioned_positively: 0.6
    mentioned_neutrally: 0.3
    not_mentioned: 0.0

queries:
  version: "2026-02-v1"

  generic:
    # --- Service-Queries (Lösungssuche) ---
    - query: "Welche Cybersecurity-Anbieter sind die besten für den Mittelstand in Deutschland?"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "Empfehlung für Penetration Testing Dienstleister im DACH-Raum"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "Top Managed Security Service Provider für Unternehmen"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "Wer bietet gute SOC as a Service Lösungen in Deutschland an?"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "Professionelle Incident Response Dienstleister im DACH-Raum"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "Zertifizierter Security Audit Anbieter für deutsche Unternehmen"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "Cloud Security Anbieter Vergleich für Enterprise-Kunden"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "SIEM-Lösung für mittelständische Unternehmen gesucht"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "Vulnerability Management Anbieter mit guten Referenzen"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "Security Awareness Training Anbieter für Unternehmen in Deutschland"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "CISO as a Service Anbieter im DACH-Raum"
      category: service
      intent: "Suche nach Lösungsanbietern"

    - query: "Zero Trust Implementation Partner für deutsche Firmen"
      category: service
      intent: "Suche nach Lösungsanbietern"

    # --- Problem-Queries (Problemlösung) ---
    - query: "Wie schütze ich mein Unternehmen vor Ransomware-Angriffen?"
      category: problem
      intent: "Problemlösungs-orientierte Suche"

    - query: "Was tun bei einem Cyberangriff auf mein Unternehmen?"
      category: problem
      intent: "Problemlösungs-orientierte Suche"

    - query: "Hilfe bei Phishing-Angriff gesucht — welche Firma kann helfen?"
      category: problem
      intent: "Problemlösungs-orientierte Suche"

    - query: "Schutz vor DDoS-Attacken für mittelständische Unternehmen"
      category: problem
      intent: "Problemlösungs-orientierte Suche"

    - query: "IT-Sicherheitsvorfall im Unternehmen — welcher Dienstleister hilft sofort?"
      category: problem
      intent: "Problemlösungs-orientierte Suche"

    - query: "Wie erkenne ich Advanced Persistent Threats frühzeitig?"
      category: problem
      intent: "Problemlösungs-orientierte Suche"

    - query: "NIS2-Compliance — welches Unternehmen unterstützt bei der Umsetzung?"
      category: problem
      intent: "Problemlösungs-orientierte Suche"

    - query: "Supply-Chain-Angriffe verhindern — welche Lösungen gibt es?"
      category: problem
      intent: "Problemlösungs-orientierte Suche"

    # --- Comparison-Queries (Vergleich/Auswahl) ---
    - query: "Vergleich der besten Cybersecurity-Anbieter in Deutschland"
      category: comparison
      intent: "Vergleichs- und Auswahlsuche"

    - query: "Top 10 IT-Sicherheitsunternehmen im DACH-Raum"
      category: comparison
      intent: "Vergleichs- und Auswahlsuche"

    - query: "Welcher Managed Security Anbieter hat das beste Preis-Leistungs-Verhältnis?"
      category: comparison
      intent: "Vergleichs- und Auswahlsuche"

    - query: "Marktführer für IT-Sicherheit in Deutschland — wer liegt vorn?"
      category: comparison
      intent: "Vergleichs- und Auswahlsuche"

    - query: "Endpoint Protection: Welcher Anbieter ist der beste?"
      category: comparison
      intent: "Vergleichs- und Auswahlsuche"

    - query: "Ranking der besten Cybersicherheitsfirmen für Unternehmen"
      category: comparison
      intent: "Vergleichs- und Auswahlsuche"

    # --- Industry-Queries (Branchenwissen) ---
    - query: "IT-Sicherheit Beratung für KRITIS-Betreiber in Deutschland"
      category: industry
      intent: "Branchen- und Expertenwissen-Suche"

    - query: "BSI-zertifizierter Cybersecurity-Anbieter gesucht"
      category: industry
      intent: "Branchen- und Expertenwissen-Suche"

    - query: "ISO 27001 Beratung für Unternehmen im DACH-Raum"
      category: industry
      intent: "Branchen- und Expertenwissen-Suche"

    - query: "SOC-Betreiber für mittelständische Unternehmen in Deutschland"
      category: industry
      intent: "Branchen- und Expertenwissen-Suche"

    - query: "Cyber Defense Center Anbieter in Deutschland"
      category: industry
      intent: "Branchen- und Expertenwissen-Suche"

    - query: "OT-Security Spezialisten für Fertigungsindustrie"
      category: industry
      intent: "Branchen- und Expertenwissen-Suche"

    - query: "Cybersecurity für Finanzdienstleister — welche Anbieter sind spezialisiert?"
      category: industry
      intent: "Branchen- und Expertenwissen-Suche"

    - query: "Informationssicherheit für öffentliche Verwaltung — wer ist empfehlenswert?"
      category: industry
      intent: "Branchen- und Expertenwissen-Suche"

  brand:
    - query: "Ist {company_name} ein guter Anbieter für Cybersecurity?"
      category: brand
      intent: "Direkte Markenbewertung"

    - query: "{company_name} Erfahrungen und Bewertungen"
      category: brand
      intent: "Direkte Markenbewertung"

    - query: "Was sagen Kunden über {company_name}?"
      category: brand
      intent: "Direkte Markenbewertung"

    - query: "Kennt jemand {company_name}? Lohnt sich der Anbieter?"
      category: brand
      intent: "Direkte Markenbewertung"

    - query: "Wie gut ist {company_name} im Vergleich zu anderen Cybersecurity-Anbietern?"
      category: brand
      intent: "Direkte Markenbewertung"

    - query: "{company_name} Cybersecurity Bewertung und Test"
      category: brand
      intent: "Direkte Markenbewertung"

    - query: "Gibt es gute Alternativen zu {company_name}?"
      category: brand
      intent: "Direkte Markenbewertung"

    - query: "{company_name} für Mittelstand geeignet?"
      category: brand
      intent: "Direkte Markenbewertung"

  # Referenzlisten für Analyzer (Competitor-Erkennung)
  known_competitors:
    - CrowdStrike
    - Palo Alto Networks
    - Fortinet
    - Sophos
    - Trend Micro
    - Check Point
    - SentinelOne
    - Darktrace
    - Cisco
    - McAfee
    - Symantec
    - FireEye
    - Proofpoint
    - Zscaler
    - Okta
    - Tenable
    - Rapid7
    - Qualys
```

**Query-Verteilung: 40 total (32 generic + 8 brand)**

| Kategorie | Anzahl | Anteil |
|-----------|--------|--------|
| service | 12 | 30% |
| problem | 8 | 20% |
| comparison | 6 | 15% |
| industry | 8 | 20% |
| brand | 8 | 20% (firmenspezifisch, nur `{company_name}` variiert) |
| **Gesamt** | **42** | |

---

## 4. Vereinfachter QueryGenerator

Der bestehende `QueryGenerator` (308 Zeilen) wird auf ~40 Zeilen reduziert:

```python
class QueryGenerator:
    """Liest kuratierte Query-Sets aus Industry Config."""

    def __init__(self, industry_config: dict):
        self.query_config = industry_config.get("queries", {})
        self.version = self.query_config.get("version", "unknown")

    def generate_queries(
        self,
        company_name: str,
        company_domain: str,
        company_description: str | None = None,
        company_location: str | None = None,
    ) -> list[dict[str, str]]:
        queries = []

        # Generic Queries — identisch für alle Firmen
        for q in self.query_config.get("generic", []):
            queries.append({
                "query": q["query"],
                "category": q.get("category", "general"),
                "intent": q.get("intent", ""),
            })

        # Brand Queries — Firmenname einsetzen
        for q in self.query_config.get("brand", []):
            queries.append({
                "query": q["query"].format(company_name=company_name),
                "category": q.get("category", "brand"),
                "intent": q.get("intent", ""),
            })

        return queries

    @property
    def query_version(self) -> str:
        return self.version
```

**Was entfällt:**
- `_get_category_target_counts()` — keine Skalierung mehr nötig
- `_generate_category_queries()` — keine Template-Auflösung mehr
- `_build_full_context()` — keine Platzhalter-Ersetzung mehr
- `_generate_variations()` — keine Auffüll-Logik mehr
- `random` Import — kein Zufall mehr

---

## 5. Versionierung

### Query-Version im Scan speichern

Neues Feld auf dem `Scan`-Model:

```python
query_version: Mapped[str | None] = mapped_column(String, nullable=True)
```

Der `scan_worker` setzt es:

```python
scan.query_version = query_generator.query_version  # z.B. "2026-02-v1"
```

### Vergleichsregeln

- Rankings zeigen nur Scans mit **gleicher Query-Version**
- Bei Version-Änderung: Warnung im UI ("Neue Query-Version verfügbar — Re-Scan empfohlen")
- Alte Scans bleiben erhalten, werden aber als "veraltet" markiert

---

## 6. Auswirkungen auf bestehende Komponenten

### Keine Änderung nötig

| Komponente | Grund |
|-----------|-------|
| `LLMClient` | Empfängt Query-Strings, egal woher sie kommen |
| `Analyzer` | Analysiert Response-Text, unabhängig von Query-Herkunft |
| `Scorer` | Berechnet Scores aus Analyse-Ergebnissen, Query-unabhängig |
| `ReportGenerator` | Nutzt aggregierte Daten, nicht Queries direkt |
| Frontend `QueryTable` | Zeigt `query_results` an — Struktur bleibt gleich |
| Frontend `ReportPageClient` | Keine Änderung |
| Cost Tracking | Unverändert — zeichnet weiterhin pro API-Call auf |

### Änderungen nötig

| Komponente | Änderung |
|-----------|----------|
| `QueryGenerator` | Komplett vereinfacht (s. Abschnitt 4) |
| `cybersecurity.yaml` | Neue Struktur mit festen Queries (s. Abschnitt 3) |
| `Scan` Model | Neues Feld `query_version` |
| `scan_worker.py` | `query_version` setzen |
| `Analyzer._extract_competitors()` | `known_competitors` aus YAML statt Hardcoded-Liste |
| Rankings API | Filter auf gleiche `query_version` |

---

## 7. Kostenanalyse

### Aktuell (10 Queries × 3 Plattformen)
- 30 API-Calls pro Scan
- ~$0.14 pro Scan

### Neu (42 Queries × 3 Plattformen)
- 126 API-Calls pro Scan
- ~$0.59 pro Scan (4.2× teurer)

### Alternative: 20 Queries (Kompromiss)
- 60 API-Calls pro Scan
- ~$0.28 pro Scan
- Empfehlung: Mit 20 starten, bei Bedarf auf 42 erweitern

### Budget-Rechnung (20 Queries, 50 Firmen/Monat)
- 50 × $0.28 = **$14/Monat**
- Gut innerhalb eines $50-Budgets

---

## 8. Migration

### Schritt 1: Bestehende Scans
- Erhalten `query_version = NULL` (Legacy)
- Werden im Ranking weiterhin angezeigt, aber als "v0 (Legacy)" markiert

### Schritt 2: Neue YAML schreiben
- `cybersecurity.yaml` mit Pre-compiled Queries ersetzen
- Alte Template-Felder (`services`, `threats`, `regions`, `templates`) entfernen

### Schritt 3: QueryGenerator ersetzen
- Alter Code wird durch vereinfachte Version ersetzt
- Tests anpassen

### Schritt 4: Re-Scans
- Alle Firmen mit neuer Query-Version re-scannen
- Ab dann: faire Vergleiche

---

## 9. Vorteile / Nachteile

### Vorteile

1. **Faire Vergleiche** — Alle Firmen einer Branche bekommen exakt dieselben generischen Queries
2. **Transparenz** — Queries sind in der YAML lesbar, kein versteckter Zufall
3. **Reproduzierbarkeit** — Gleiche Queries = gleiche Bedingungen, jederzeit
4. **Weniger Code** — QueryGenerator schrumpft von 308 auf ~40 Zeilen
5. **Versionierung** — Query-Änderungen sind nachvollziehbar, alte Scans bleiben gültig
6. **Bessere Query-Qualität** — Kuratierte Fragen > zufällige Kombinationen
7. **Einfacheres Debugging** — Man weiß immer, welche Fragen gestellt wurden

### Nachteile

1. **Handarbeit bei neuen Branchen** — ~40 Queries pro Branche müssen manuell geschrieben werden (einmalig ~30 Min)
2. **Weniger Abdeckung** — 42 feste Queries decken nicht alle Service×Region-Kombinationen ab (aber: Random tat das auch nicht)
3. **Keine automatische Anpassung** — Bei neuen Services/Threats muss die YAML manuell aktualisiert werden
4. **Re-Scan nötig** — Alle bestehenden Scans müssen neu durchgeführt werden

---

## 10. Offene Entscheidung: Query-Anzahl

| Option | Queries | API-Calls/Scan | Kosten/Scan | Genauigkeit |
|--------|---------|----------------|-------------|-------------|
| Klein | 20 (14 generic + 6 brand) | 60 | ~$0.28 | Ausreichend |
| Mittel | 30 (22 generic + 8 brand) | 90 | ~$0.42 | Gut |
| Groß | 42 (34 generic + 8 brand) | 126 | ~$0.59 | Sehr gut |

**Empfehlung:** Mit **Mittel (30)** starten. Genug Abdeckung für aussagekräftige Scores, moderate Kosten.
