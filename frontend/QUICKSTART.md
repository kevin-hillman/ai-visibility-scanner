# Quick Start Guide

## Voraussetzungen

- Node.js 18+ installiert
- Backend API läuft auf `http://localhost:8000`

## 1. Installation

```bash
cd /Users/Kevin/Documents/Coding/painpoint-researches/projects/geo-engine/frontend

# Dependencies installieren
npm install
```

## 2. Umgebungsvariablen

Die `.env.local` Datei wurde bereits erstellt mit:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 3. Development Server starten

```bash
npm run dev
```

Das Frontend ist dann erreichbar unter: **http://localhost:3000**

## 4. Seiten testen

### Landing Page
- URL: http://localhost:3000
- Features: Hero, Was ist GEO, Stats, CTA

### Ranking-Tabelle
- URL: http://localhost:3000/ranking/cybersecurity
- Features: Sortierbare Tabelle, Suche, Click to Report

### Report-Page
- URL: http://localhost:3000/report/{scan_id}
- Features: Score-Kreis, Platform-Bars, Analyse, Empfehlungen, Lead-Form

## 5. Wichtige Komponenten

### Header (Navigation)
- Logo mit Link zur Homepage
- Branchen-Dropdown (lädt automatisch aus API)
- Mobile-Menü (Hamburger)

### RankingTable
- Sortierbar nach allen Spalten
- Suchfunktion
- Responsive (Desktop: Tabelle, Mobile: Cards)
- Click on Row → Report-Page

### ScoreCircle
- Animierter SVG-Kreis
- Farbcodiert nach Score (rot/gelb/grün)
- Smooth Animation on Load

### PlatformBar
- Horizontale Fortschrittsbalken
- Platform-spezifische Farben
- Animiert beim Laden

### LeadForm
- Client-side Validation
- Success/Error States
- POST zu /api/v1/leads

## 6. API-Mock (für Testing ohne Backend)

Falls das Backend noch nicht läuft, kannst du Mock-Daten erstellen:

```typescript
// src/lib/api.ts - temporär für Testing
export async function fetchRanking(industryId: string): Promise<RankingResponse> {
  // Mock data für Testing
  return {
    industry_id: industryId,
    industry_name: "Cybersecurity",
    total_companies: 50,
    entries: [
      {
        rank: 1,
        company_name: "SecureTech GmbH",
        domain: "securetech.de",
        overall_score: 85,
        platform_scores: { chatgpt: 90, claude: 85, gemini: 80, perplexity: 85 },
        industry_id: industryId,
        scan_id: "scan_123",
      },
      // ... mehr Einträge
    ],
    last_updated: new Date().toISOString(),
  };
}
```

## 7. TypeScript Check

```bash
npx tsc --noEmit
```

Sollte keine Fehler zeigen.

## 8. Build für Production

```bash
npm run build
npm start
```

Production Build läuft dann auf http://localhost:3000

## Troubleshooting

### Port 3000 bereits belegt?
```bash
# In package.json unter "scripts" ändern:
"dev": "next dev -p 3001"
```

### API-Verbindung schlägt fehl?
- Stelle sicher, dass Backend auf Port 8000 läuft
- Check `.env.local` für korrekte API_URL
- Öffne Browser DevTools → Network Tab für API-Requests

### Styling funktioniert nicht?
- Stelle sicher, dass `tailwindcss` installiert ist
- Check `src/app/globals.css` für korrektes Import

### TypeScript-Fehler?
```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. Backend starten (falls noch nicht geschehen)
2. Testdaten über Backend-Seeder einfügen
3. Frontend öffnen und durch Seiten navigieren
4. Lead-Formular testen
5. Mobile-Ansicht in DevTools testen

## Support

Bei Fragen oder Problemen:
- Check `README.md` für detaillierte Dokumentation
- Review `src/lib/api.ts` für API-Typen und Endpoints
- Inspect Browser Console für Fehler
