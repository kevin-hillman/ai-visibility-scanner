# AI Visibility Scanner (GEO Intelligence Engine) - Agent Notes

Diese Datei ist die repo-lokale Arbeitsanweisung fuer Coding-Agents und Contributors.
Ziel: schnelle Orientierung, stabile API/Frontend-Contracts, und klare Definitionen fuer die Lead-Gen Ranking-UX.

## Produktziel
- Erzeuge "offizielle" Branchen-Rankings (DACH) basierend auf KI-Sichtbarkeit von Firmen.
- Nutze Ranking + Report als Lead-Gen Funnel (CTA, Lead-Form, Report-Open).
- Fokus: "mit Firmennamen" (Brand-Queries sind erlaubt/erwuenscht), aber Discovery-Queries koennen spaeter ergaenzt werden.

## Repo-Struktur
- `backend/`: FastAPI + SQLAlchemy + Scan-Orchestrierung + Report/Scoring.
- `frontend/`: Next.js App Router Dashboard (Ranking/Report/Lead).

## Lokales Setup
Backend (FastAPI):
```bash
cd backend
./venv/bin/python -m pip install -r requirements.txt
./venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Frontend (Next.js):
```bash
cd frontend
npm install
npm run dev
```

Umgebungsvariablen:
- Backend: `backend/.env` (Keys fuer OpenAI/Anthropic/Google/Perplexity).
- Frontend: `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Quality Gates (vor PR/Release)
Backend:
```bash
cd backend
./venv/bin/python -m pytest -q
```

Frontend:
```bash
cd frontend
npm run lint
npm run build
```

Hinweis: Unit-Tests duerfen keine echten LLM-Requests ausloesen. Echte Scans nur ueber explizite Scripts/Manuallauf.

## API Contracts (Frontend-relevant)
Diese Contracts muessen stabil bleiben. Wenn sich Backend-Response-Shape aendert, muessen `frontend/src/lib/api.ts` und die Pages mitgezogen werden.

Ranking:
- Endpoint: `GET /api/v1/rankings/{industry_id}`
- Erwartete Felder pro Entry: `rank`, `company_name`, `domain`, `overall_score`, `platform_scores`, `industry_id`.
- Wenn Ranking-Items klickbar zu Reports sein sollen, braucht jedes Entry den `scan_id` des latest completed Scans.

Report:
- Endpoint: `GET /api/v1/reports/{scan_id}`
- `scan.platform_scores` sollte stets alle Plattformen enthalten (mindestens `chatgpt`, `claude`, `gemini`, `perplexity`) damit die UI nicht auf missing keys crasht.

Scan Query Results (wichtig fuer HTML-Report und spaetere UI-Details):
- `scan.query_results` sollen je Result mindestens enthalten: `query`, `category`, `platform`, `response_text` und die Analyzer-Felder (`mentioned`, `mention_type`, `position`, `sentiment`, `competitors_mentioned`, `context`, `mention_count`).

## Lead-Gen Ranking UX (Referenz: nexorbit.ai/ranking)
Das Ranking ist ein Marketing-Asset. UX-Default soll wie folgt wirken:
- Hero mit Jahr (z.B. "SEO Agenturen Ranking 2026") und Subline ("Die besten DACH-Agenturen ...").
- "Official ranking" Badge / Trust-Element im Header-Bereich.
- Liste statt Tabelle: jeder Eintrag als Card/Row mit Rang-Badge, Name + Domain, Score, Button "Report oeffnen".
- Mid-page CTA-Card ("Starte dein eigenes KI-Tracking...") als Upsell/Lead Magnet.
- Jede Card sollte einen klaren Klickpfad haben (Row klickbar oder nur Button), aber niemals "tote" Klicks.

Design-Prinzipien:
- Dunkles, hochwertiges Theme; grosse Typografie; klare Hierarchie; wenige, starke CTAs.
- Performance: Ranking muss schnell "above the fold" erscheinen (Skeleton/Loading minimal halten).

## Branchen-Konfigurationen
- Liegen in `backend/industries/*.yaml`.
- Plattformen/Weights/Model-IDs sind pro Industry konfigurierbar.
- Queries werden aus Templates generiert (`backend/app/services/query_generator.py`).

Wichtig:
- Platzhalter in Templates muessen vom Generator-Context geliefert werden (z.B. `{service}`, `{competitor}`, `{region}`).
- `queries.total` wird als Budget enforced: Kategorie-Counts werden deterministisch auf `total` skaliert.

## Non-Goals
- Keine echten Provider-Keys in Git.
- Keine langen synchronen Requests im Web-Request-Pfad fuer Production. Wenn Scan-Laufzeiten steigen: Background Jobs/Queue einplanen.

## Definition of Done (Feature-Work)
- Backend + Frontend bauen/Tests laufen gruen (siehe Quality Gates).
- Contract-Aenderungen sind dokumentiert (mindestens in PR-Beschreibung, idealerweise hier).
- Ranking hat keine toten Klickpfade (wenn UI "Report oeffnen" zeigt, muss `scan_id` garantiert vorhanden sein).
