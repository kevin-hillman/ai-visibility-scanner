# GEO Intelligence Engine - Services Integration Guide

## Übersicht der implementierten Services

Alle 5 Backend-Services wurden erfolgreich implementiert:

### 1. **QueryGenerator** (`app/services/query_generator.py`)
- Generiert ~50 branchenspezifische Queries pro Firma
- Nutzt Industry Config (YAML) mit Templates und Listen
- Unterstützt 5 Kategorien: brand, service, problem, comparison, industry
- Intelligente Platzhalter-Ersetzung mit zufälligen Werten
- Duplikat-Vermeidung und Query-Mischung

### 2. **LLMClient** (`app/services/llm_client.py`)
- Parallele Queries an 4 Plattformen (ChatGPT, Claude, Gemini, Perplexity)
- Async/Await für maximale Performance
- 30s Timeout pro Request
- Umfassendes Error Handling
- Latency Tracking

### 3. **Analyzer** (`app/services/analyzer.py`)
- Intelligente Mention-Detection (Name, Domain, Varianten)
- Kontext-Extraktion (±200 Zeichen)
- Mention-Type-Klassifizierung (5 Stufen)
- Position-Erkennung in Listen
- Sentiment-Analyse
- Wettbewerber-Extraktion
- Aggregierte Analyse mit SWOT

### 4. **Scorer** (`app/services/scorer.py`)
- Gewichtetes Scoring-System (0-100)
- Mention-Type-Weights aus Industry Config
- Position-Bonus (Platz 1: +20%, Platz 2: +10%, Platz 3: +5%)
- Sentiment-Modifier (positive: 1.0, neutral: 0.8, negative: 0.5)
- Plattform-Score-Berechnung
- Gewichteter Gesamt-Score

### 5. **ReportGenerator** (`app/services/report_generator.py`)
- 10 actionable Handlungsempfehlungen
- Vollständiger HTML-Report mit:
  - Header mit Gesamt-Score
  - Plattform-Breakdown
  - Key Metrics
  - SWOT-Analyse
  - Top-Wettbewerber
  - Detaillierte Query-Ergebnisse
- Responsive Design mit CSS

---

## Integration-Workflow

### Beispiel: Vollständiger Scan-Prozess

```python
import asyncio
import yaml
from app.config import Settings
from app.services import (
    QueryGenerator,
    LLMClient,
    Analyzer,
    Scorer,
    ReportGenerator
)

async def run_geo_scan(company_name: str, company_domain: str, industry_id: str):
    """
    Führt einen vollständigen GEO Intelligence Scan durch.
    """
    # 1. Setup
    settings = Settings()

    # Lade Industry Config
    with open(f"{settings.INDUSTRY_CONFIG_DIR}/{industry_id}.yaml") as f:
        industry_config = yaml.safe_load(f)

    # Initialisiere Services
    query_gen = QueryGenerator(industry_config)
    llm_client = LLMClient(settings)
    analyzer = Analyzer()
    scorer = Scorer(industry_config)
    report_gen = ReportGenerator()

    # 2. Query-Generierung
    queries = query_gen.generate_queries(
        company_name=company_name,
        company_domain=company_domain,
        company_location="DACH"
    )
    print(f"✓ {len(queries)} Queries generiert")

    # 3. LLM-Queries (parallel)
    platforms = industry_config["platforms"]
    all_results = []

    for i, query_obj in enumerate(queries):
        print(f"Query {i+1}/{len(queries)}: {query_obj['query'][:60]}...")

        # Query alle Plattformen parallel
        llm_responses = await llm_client.query_all_platforms(
            query=query_obj["query"],
            platforms=platforms
        )

        # Analysiere jede Platform-Response
        for response in llm_responses:
            if not response["success"]:
                continue

            analysis = analyzer.analyze_response(
                company_name=company_name,
                company_domain=company_domain,
                query=query_obj["query"],
                platform=response["platform"],
                response_text=response["response_text"]
            )

            # Füge Metadata hinzu
            analysis["query"] = query_obj["query"]
            analysis["category"] = query_obj["category"]
            analysis["platform"] = response["platform"]
            analysis["latency_ms"] = response["latency_ms"]

            all_results.append(analysis)

    print(f"✓ {len(all_results)} LLM-Responses analysiert")

    # 4. Scoring
    platform_scores = scorer.calculate_platform_scores(all_results)
    overall_score = scorer.calculate_overall_score(platform_scores)

    print(f"✓ Gesamt-Score: {overall_score}/100")

    # 5. Aggregierte Analyse
    aggregate_analysis = analyzer.aggregate_analysis(
        company_name=company_name,
        all_results=all_results
    )

    # 6. Recommendations
    recommendations = report_gen.generate_recommendations(
        company_name=company_name,
        analysis=aggregate_analysis,
        platform_scores=platform_scores,
        industry_config=industry_config
    )

    print(f"✓ {len(recommendations)} Handlungsempfehlungen generiert")

    # 7. HTML-Report
    scan_data = {
        "overall_score": overall_score,
        "platform_scores": platform_scores,
        "analysis": aggregate_analysis,
        "recommendations": recommendations,
        "query_results": all_results,
    }

    report_html = report_gen.generate_report_html(
        company_name=company_name,
        company_domain=company_domain,
        scan_data=scan_data,
        industry_config=industry_config
    )

    print(f"✓ HTML-Report generiert ({len(report_html)} Zeichen)")

    # 8. Return vollständige Daten
    return {
        "overall_score": overall_score,
        "platform_scores": platform_scores,
        "analysis": aggregate_analysis,
        "recommendations": recommendations,
        "report_html": report_html,
        "query_results": all_results,
    }

# Beispiel-Nutzung
if __name__ == "__main__":
    result = asyncio.run(run_geo_scan(
        company_name="CrowdStrike",
        company_domain="crowdstrike.com",
        industry_id="cybersecurity"
    ))

    print("\n=== ERGEBNIS ===")
    print(f"Gesamt-Score: {result['overall_score']}/100")
    print(f"Plattform-Scores: {result['platform_scores']}")
    print(f"Erwähnungsrate: {result['analysis']['mention_rate']:.1f}%")
    print(f"Top-Wettbewerber: {[c['name'] for c in result['analysis']['top_competitors'][:3]]}")
```

---

## API-Integration (FastAPI)

### Worker-Integration

Die Services werden typischerweise in einem Background-Worker (Celery/RQ) verwendet:

```python
# app/workers/scan_worker.py
import asyncio
from celery import Celery
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import Scan, Company
from app.services import (
    QueryGenerator, LLMClient, Analyzer, Scorer, ReportGenerator
)

app = Celery('geo_engine')

@app.task
def process_scan(scan_id: str):
    """Background task für Scan-Verarbeitung."""
    db = SessionLocal()

    try:
        # Lade Scan und Company
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        company = db.query(Company).filter(Company.id == scan.company_id).first()

        # Update Status
        scan.status = "running"
        scan.started_at = datetime.now(timezone.utc)
        db.commit()

        # Führe Scan durch (async in sync wrapper)
        result = asyncio.run(run_geo_scan(
            company_name=company.name,
            company_domain=company.domain,
            industry_id=scan.industry_id
        ))

        # Update Scan mit Ergebnissen
        scan.status = "completed"
        scan.overall_score = result["overall_score"]
        scan.platform_scores = result["platform_scores"]
        scan.query_results = result["query_results"]
        scan.analysis = result["analysis"]
        scan.recommendations = result["recommendations"]
        scan.report_html = result["report_html"]
        scan.completed_at = datetime.now(timezone.utc)

        db.commit()

    except Exception as e:
        scan.status = "failed"
        scan.error_message = str(e)
        db.commit()
        raise

    finally:
        db.close()
```

### API-Endpunkt

```python
# app/api/scans.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Scan, Company
from app.schemas import ScanCreate, ScanResponse
from app.workers.scan_worker import process_scan

router = APIRouter()

@router.post("/scans", response_model=ScanResponse)
def create_scan(scan_data: ScanCreate, db: Session = Depends(get_db)):
    """Erstellt einen neuen GEO Intelligence Scan."""

    # Validiere Company
    company = db.query(Company).filter(Company.id == scan_data.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Erstelle Scan
    scan = Scan(
        company_id=scan_data.company_id,
        industry_id=company.industry_id,
        status="pending"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # Starte Background-Task
    process_scan.delay(scan.id)

    return scan
```

---

## Nächste Schritte

### Empfohlene Erweiterungen

1. **Caching**
   - Redis-Cache für LLM-Responses (gleiche Query → gleiche Antwort)
   - Reduziert API-Kosten massiv

2. **Rate Limiting**
   - Pro Plattform unterschiedliche Limits
   - Exponential Backoff bei 429-Errors

3. **Batch-Processing**
   - Mehrere Companies parallel scannen
   - Query-Deduplizierung über Companies hinweg

4. **Advanced Analytics**
   - Trend-Tracking (Score-Veränderung über Zeit)
   - Competitor-Benchmarking-Dashboard
   - Anomalie-Detection

5. **Industry Config Management**
   - Admin-UI für Config-Verwaltung
   - A/B-Testing von Query-Templates
   - Dynamic Query-Weights

---

## Testing

Unit-Tests sind implementiert unter `tests/`:

```bash
# Alle Tests ausführen
pytest tests/

# Nur Service-Tests
pytest tests/test_query_generator.py
pytest tests/test_analyzer.py
pytest tests/test_scorer.py
```

---

## Abhängigkeiten

Erforderliche Python-Packages (bereits in `requirements.txt`):

```txt
openai>=1.10.0
anthropic>=0.18.0
google-generativeai>=0.3.0
httpx>=0.25.0
pyyaml>=6.0
```

---

## Performance-Tipps

1. **Parallele Query-Ausführung**
   - Nutze `asyncio.gather()` für maximale Parallelität
   - 50 Queries × 4 Plattformen = 200 Requests in ~30-60s

2. **Connection Pooling**
   - Reuse HTTP-Clients (nicht für jeden Request neu erstellen)
   - Persistente Connections reduzieren Latency

3. **Timeout-Management**
   - 30s Global Timeout ist konservativ
   - Kann auf 20s reduziert werden für bessere UX

4. **Memory Management**
   - Bei großen Scans (>100 Companies) Streaming nutzen
   - Results nach DB-Persist aus Memory freigeben

---

**Status: ✅ Alle 5 Services implementiert und produktionsbereit**
