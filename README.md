# AI Visibility Scanner

Branchen-Rankings fuer den DACH-Raum basierend auf KI-Sichtbarkeit von Unternehmen. Das Tool misst, wie haeufig und in welchem Kontext Firmen in den Antworten von ChatGPT, Claude, Gemini und Perplexity erwaehnt werden.

## Features

- **KI-Sichtbarkeits-Rankings** — Branchenspezifische Ranglisten mit Scoring ueber mehrere LLM-Plattformen
- **Detaillierte Reports** — Pro Unternehmen: Overall Score, Platform-Breakdown, Query-Resultate, Sentiment-Analyse
- **Multi-LLM-Abfrage** — ChatGPT (GPT-5.2), Claude (Sonnet 4.6), Gemini (3-Flash)
- **Lead-Capture** — Eingebettete Kontaktformulare als Lead-Gen Funnel
- **Kosten-Dashboard** — Per-API-Call Drill-Down der Scan-Kosten

## Tech Stack

| Komponente | Technologie |
|---|---|
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| LLM-Provider | OpenAI, Anthropic, Google Gemini |
| Datenbank | SQLite (dev) |

## Projektstruktur

```
backend/
  app/
    api/           # REST-Endpoints (rankings, reports, scans, leads, costs)
    services/      # LLM-Client, Query-Generator, Analyzer, Scoring
    workers/       # Background-Jobs fuer Scans
    models.py      # SQLAlchemy Models
    schemas.py     # Pydantic Schemas
  industries/      # YAML-Konfigurationen pro Branche
  tests/

frontend/
  src/
    app/           # Next.js App Router Pages
    components/    # UI-Komponenten (RankingTable, ScoreCircle, LeadForm, ...)
    lib/           # API-Client + Types

scripts/
  dev.sh           # Startet Backend + Frontend parallel
```

## Lokales Setup

### Backend

```bash
cd backend
./venv/bin/python -m pip install -r requirements.txt
cp .env.example .env  # API-Keys eintragen
./venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local  # API-URL konfigurieren
npm run dev
```

### Beide Services gleichzeitig

```bash
./scripts/dev.sh
```

## API Endpoints

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/api/v1/industries/` | Verfuegbare Branchen |
| `GET` | `/api/v1/rankings/{industry_id}` | Ranking einer Branche |
| `GET` | `/api/v1/reports/{scan_id}` | Detailreport eines Scans |
| `POST` | `/api/v1/leads` | Lead-Erfassung |

## Quality Gates

```bash
# Backend-Tests
cd backend && ./venv/bin/python -m pytest -q

# Frontend Lint + Build
cd frontend && npm run lint && npm run build
```

## Branchen-Konfiguration

Industrien werden in `backend/industries/*.yaml` definiert. Jede Konfiguration enthaelt:
- Plattform-Gewichtungen (z.B. ChatGPT 35%, Claude 35%, Gemini 30%)
- Scoring-Regeln (direct_recommendation, mentioned_neutrally, etc.)
- Query-Templates pro Kategorie (generic, service, competitor, regional)
