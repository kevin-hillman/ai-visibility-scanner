# GEO Intelligence Engine - Frontend

Professionelles Next.js Dashboard zur Visualisierung der KI-Sichtbarkeit von Unternehmen. Lead-Gen-Tool für GEO/SEO-Consulting im Cybersecurity-Bereich.

## Features

- **Ranking-Tabellen**: Interaktive Übersicht der Top-Unternehmen nach KI-Sichtbarkeit
- **Detaillierte Reports**: Umfassende Analyse mit Scores, Stärken, Schwächen und Handlungsempfehlungen
- **Platform-Breakdown**: Scores für ChatGPT, Claude, Gemini und Perplexity
- **Lead-Capture**: Formulare zur Kontaktaufnahme potentieller Kunden
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS
- **API**: REST API auf http://localhost:8000/api/v1

## Installation

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build
npm run build
npm start
```

## Umgebungsvariablen

Erstelle eine `.env.local` Datei:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Projektstruktur

```
src/
├── app/
│   ├── layout.tsx              # Root Layout mit Header/Footer
│   ├── page.tsx                # Landing Page
│   ├── ranking/[industry]/     # Ranking-Tabellen pro Branche
│   └── report/[id]/            # Individuelle Unternehmens-Reports
├── components/
│   ├── Header.tsx              # Navigation
│   ├── Footer.tsx              # Footer
│   ├── RankingTable.tsx        # Interaktive Ranking-Tabelle
│   ├── ScoreCircle.tsx         # Animierter Score-Kreis
│   ├── PlatformBar.tsx         # Horizontaler Score-Balken
│   ├── RecommendationCard.tsx  # Empfehlungs-Karte
│   └── LeadForm.tsx            # Lead-Capture-Formular
└── lib/
    ├── api.ts                  # API-Client und TypeScript Types
    └── utils.ts                # Utility-Funktionen (Farben, Formatierung)
```

## API Endpoints

### GET /api/v1/rankings/{industry_id}
Liefert Ranking-Daten für eine Branche.

### GET /api/v1/reports/{scan_id}
Liefert detaillierten Report für ein Unternehmen.

### GET /api/v1/industries
Liefert Liste aller verfügbaren Branchen.

### POST /api/v1/leads
Erstellt einen neuen Lead.

## Design-System

### Farbschema
- **Hintergrund**: #0a0a0f (Dunkelgrau)
- **Akzent**: #06b6d4 (Cyan) - CTAs, Links, aktive Elemente
- **Erfolg**: #10b981 (Emerald) - Positive Scores
- **Warnung**: #eab308 (Yellow) - Mittlere Scores
- **Fehler**: #f43f5e (Rose) - Niedrige Scores

### Typografie
- **Font**: Inter (Google Fonts), System Font Stack als Fallback
- **Sizes**: Groß und klar, viel Whitespace
- **Weights**: Bold für Headlines, Regular/Medium für Text

## Development

```bash
# Dev Server mit Hot Reload
npm run dev

# TypeScript Type Check
npx tsc --noEmit

# Linting
npm run lint

# Production Build testen
npm run build && npm start
```

## Browser-Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile: iOS Safari, Chrome Android

## Lizenz

Proprietär - Alle Rechte vorbehalten
