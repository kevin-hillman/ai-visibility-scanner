# Kostentracking — Design-Dokument

**Datum:** 2026-02-17
**Zweck:** Internes Monitoring aller API-Kosten mit maximaler Granularität (pro Query, pro Plattform, pro Scan)
**Sichtbarkeit:** Admin-Dashboard (Frontend) + CLI-Tool, keine Kundenanzeige

---

## Datenmodell

### Neue Tabelle: `api_call_costs`

Eine Zeile pro API-Call — maximale Tiefe.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | String (UUID) | Primary Key |
| `scan_id` | String (FK → scans) | Zugehöriger Scan |
| `platform` | String | chatgpt / claude / gemini / perplexity |
| `model` | String | gpt-4o, claude-sonnet-4-5-20250929, etc. |
| `query` | Text | Die gestellte Frage |
| `input_tokens` | Integer | Prompt-Tokens |
| `output_tokens` | Integer | Completion-Tokens |
| `total_tokens` | Integer | Summe |
| `cost_usd` | Float | Berechnete Kosten in USD |
| `latency_ms` | Integer | Antwortzeit |
| `success` | Boolean | Ob der Call erfolgreich war |
| `created_at` | DateTime | Zeitstempel |

Indizes: `scan_id`, `platform`, `created_at`

### Neue Tabelle: `cost_budgets`

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | String (UUID) | Primary Key |
| `month` | String (unique) | Format "2026-02" |
| `budget_usd` | Float | Monatliches Limit |
| `warning_threshold` | Float | Warnschwelle (0.0–1.0, z.B. 0.8 = 80%) |
| `created_at` | DateTime | Zeitstempel |

### Erweiterung: `scans`-Tabelle

Zwei neue Felder (denormalisiert für schnellen Zugriff):
- `total_cost_usd: Float | None`
- `total_tokens: Integer | None`

---

## Token-Extraktion

Der `LLMClient.query_platform()` wird erweitert, um Token-Metadaten aus den API-Responses zu extrahieren:

- **OpenAI:** `response.usage.prompt_tokens`, `response.usage.completion_tokens`
- **Anthropic:** `message.usage.input_tokens`, `message.usage.output_tokens`
- **Gemini:** `response.usage_metadata.prompt_token_count`, `response.usage_metadata.candidates_token_count`
- **Perplexity:** `data["usage"]["prompt_tokens"]`, `data["usage"]["completion_tokens"]`

Das Response-Dictionary wird um `input_tokens`, `output_tokens`, `total_tokens` ergänzt.

---

## Cost-Calculation-Service

Neuer Service `backend/app/services/cost_calculator.py`:

- Konfigurierbare Preisliste pro Model (USD pro 1M Tokens, Input/Output getrennt)
- Berechnet `cost_usd` aus Token-Counts + Preisliste
- Fallback: Zeichenlänge-basierte Schätzung wenn Token-Counts fehlen (≈4 Zeichen/Token)
- Budget-Check-Methode: prüft Monatsausgaben gegen Budget-Schwelle

---

## Scan-Worker-Integration

Nach jedem `query_all_platforms()`-Batch:
1. Token-Daten aus jeder Response extrahieren
2. Kosten pro Call berechnen
3. `ApiCallCost`-Zeile in DB schreiben

Am Scan-Ende:
4. `scan.total_cost_usd` und `scan.total_tokens` aggregieren und setzen
5. Budget-Warnung loggen wenn Monatsbudget-Schwelle überschritten

---

## API-Endpunkte

Neuer Router `costs.py` unter `/api/v1/costs/`:

| Endpunkt | Methode | Beschreibung |
|----------|---------|-------------|
| `/costs/summary` | GET | Monatsübersicht (Gesamtkosten, pro Plattform, Trend) |
| `/costs/by-scan/{scan_id}` | GET | Kosten-Details eines Scans |
| `/costs/by-platform` | GET | Aggregation nach Plattform (query: `?from=&to=`) |
| `/costs/budget` | GET | Aktuelles Budget + Auslastung |
| `/costs/budget` | PUT | Budget setzen/ändern |

---

## Admin-Dashboard (Frontend)

Neue Seite `/admin/costs`:

- **KPI-Leiste:** Kosten diesen Monat | Anzahl API-Calls | Ø Kosten/Scan | Budget-Auslastung
- **Plattform-Breakdown:** Horizontale Balken (Kosten pro Plattform, gleicher Stil wie Report-Seite)
- **Zeitverlauf:** Kosten pro Tag als CSS-Balkendiagramm (keine externe Chart-Library)
- **Scan-Tabelle:** Letzte Scans mit Firma, Datum, Kosten, Token-Count — sortierbar
- **Budget-Warnung:** Gelbes/rotes Banner bei 80%/100% Budget-Auslastung

Kein Auth-System — URL-basierter Schutz ausreichend (internes Tool).

---

## CLI-Tool

Script `backend/cli/costs.py`:

- `python -m cli.costs summary` — Monatsübersicht (Tabelle im Terminal)
- `python -m cli.costs detail <scan_id>` — Aufschlüsselung pro Query/Plattform
- `python -m cli.costs budget set <betrag>` — Monatsbudget setzen
- Formatierte Ausgabe mit `rich`-Library
