# Design Overhaul: AI Visibility Scanner

**Datum:** 2026-02-17
**Ansatz:** "Stripe-Warm" — Professionell, warm, einladend
**Status:** Approved

---

## Design-Ziele

1. Weg vom generischen AI-Dark-Mode-Look (kein Glasmorphism, keine exzessiven Gradienten)
2. Clean & Minimal mit warmem Touch (Vorbild: Stripe, Vercel)
3. Light Mode + Dark Mode mit Toggle
4. Emerald/Teal als Akzentfarbe statt Cyan
5. Professionelle B2B SaaS-Ausstrahlung

---

## Design-System

### Farbpalette

**Light Mode:**

| Rolle | Wert | Tailwind | Verwendung |
|---|---|---|---|
| Background | #ffffff | `bg-white` | Primärer Hintergrund |
| Surface | #f8faf9 | `bg-gray-50` | Sektions-Wechsel, Card-BG |
| Border | #e5e7eb | `border-gray-200` | Trennlinien, Card-Borders |
| Text Primary | #111827 | `text-gray-900` | Headlines, wichtiger Text |
| Text Secondary | #6b7280 | `text-gray-500` | Body-Text, Beschreibungen |
| Text Muted | #9ca3af | `text-gray-400` | Labels, Platzhalter |
| Accent | #0d9488 | `text-teal-600` | CTAs, Links, Akzente |
| Accent Hover | #0f766e | `text-teal-700` | Hover-States |
| Accent Light | #ccfbf1 | `bg-teal-100` | Badges, Hint-BG |

**Dark Mode:**

| Rolle | Wert | Tailwind | Verwendung |
|---|---|---|---|
| Background | #0f1117 | Custom | Primärer Hintergrund |
| Surface | #1a1d27 | Custom | Cards, erhöhte Flächen |
| Border | #2e3039 | Custom | Trennlinien |
| Text Primary | #f3f4f6 | `text-gray-100` | Headlines |
| Text Secondary | #9ca3af | `text-gray-400` | Body-Text |
| Accent | #2dd4bf | `text-teal-400` | CTAs, Links |
| Accent Light | #0d3d38 | Custom | Badges, Hint-BG |

**Score-Farben (beide Modi):**
- Gut (>=70): Emerald-500 / Emerald-400
- Mittel (40-69): Yellow-500 / Yellow-400
- Schlecht (<40): Rose-500 / Rose-400

**Platform-Farben:**
- ChatGPT: Emerald/Grün
- Claude: Orange
- Gemini: Blue
- Perplexity: Violet/Lila

### Typografie

- **Font:** Inter (Google Fonts)
- **Headlines:** `font-semibold`, `text-lg` bis `text-5xl`
- **Body:** `text-base` (16px), `leading-relaxed`
- **Labels/Overlines:** `text-sm font-medium tracking-wide uppercase`

### Komponenten-Stil

- **Cards:** `bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl shadow-sm hover:shadow-md transition-shadow`
- **Buttons Primary:** `bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-5 py-2.5 font-medium` (optional Gradient: `bg-gradient-to-r from-teal-600 to-emerald-600`)
- **Buttons Secondary:** `border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-5 py-2.5`
- **Inputs:** `border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500`
- **Kein Glasmorphism** (keine `backdrop-blur` auf Content, kein `bg-white/10`)
- **Header-Ausnahme:** `backdrop-blur-sm` nur auf sticky Header erlaubt

### Besondere Akzente

- Dezentes Dot-Grid Pattern auf Hero-Sektionen via CSS `radial-gradient`
- Gradient nur für primäre CTA-Buttons
- Score-Farbsystem bleibt (Emerald/Yellow/Rose)

---

## Dark Mode Implementierung

- CSS custom properties für Dark-Mode-spezifische Farben
- Tailwind `dark:` Klassen für Standard-Farben
- Toggle im Header (Sun/Moon Icon)
- Nutzt `class`-basiertes Dark Mode (Tailwind `darkMode: 'class'`)
- Persistenz via `localStorage` + `prefers-color-scheme` Fallback

---

## Seiten-Designs

### Global: Header

- Sticky, `bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-sm border-b border-gray-200 dark:border-[#2e3039]`
- Logo links: Text "AI Visibility Scanner" in `font-semibold text-gray-900 dark:text-white`
- Nav rechts: "Rankings" Dropdown, "Über GEO" Link, "Kontakt" Button (Primary)
- Dark Mode Toggle: Sun/Moon Icon neben Nav
- Mobile: Hamburger-Menü im neuen Stil

### Global: Footer

- `bg-gray-50 dark:bg-[#1a1d27] border-t`
- Kompaktes Layout: Logo + Links in einer Zeile, Copyright darunter
- Links: Datenschutz, Impressum, AGB

---

### Homepage (`/`)

**1. Hero Section**
- 2-Spalten-Layout auf Desktop (`grid lg:grid-cols-2 gap-12 items-center`)
- Links: Overline ("KI-Sichtbarkeit messen") + Headline (`text-5xl`) + Subtitle + 2 CTAs
- Rechts: Mini-Ranking-Preview Card (stilisiert, leicht angewinkelt `rotate-1`, `shadow-xl`)
  - 3-4 Unternehmen mit Scores und farbigen Mini-Balken
  - Platform-Icons darunter
  - Dezenter Teal-Glow hinter der Card (`absolute blur-3xl opacity-20`)
- Dot-Grid Pattern als Hintergrund
- Trust-Element: "500+ Unternehmen analysiert"

**2. "Was ist GEO?" Section**
- Weißer Hintergrund
- Overline + Headline
- 3 Feature-Cards im Grid
  - Icon in `bg-teal-50 rounded-lg p-3`
  - Titel + Beschreibung
  - Card-Stil mit Border und Hover-Shadow

**3. Stats Section**
- Surface-Hintergrund (`bg-gray-50`)
- 3 Stats nebeneinander: Große Zahl (`text-4xl text-teal-600`) + Label

**4. CTA Section**
- Weißer Hintergrund, zentriert
- Headline + Paragraph + Primary CTA
- `border-t` als Trenner oben

---

### Ranking-Seite (`/ranking/[industry]`)

**1. Hero**
- Breadcrumb: "Rankings > Cybersecurity"
- Headline: Branchen-Name `text-3xl font-semibold`
- Meta-Badges: Update-Datum + Anzahl Unternehmen

**2. Filter/Search**
- Suchfeld mit Icon, optional Sortierung rechts
- Sticky unter Header (`sticky top-16`)

**3. Ranking-Liste**
- Cards mit horizontalem Layout:
  - Links: Rang-Badge (Gold/Silber/Bronze für 1-3) + Name + Domain
  - Mitte: Mini-Balken pro Plattform
  - Rechts: Gesamt-Score groß, farbcodiert
  - Hover: Shadow + "Report ansehen" Link

**4. Mid-Page CTA (alle ~5 Einträge)**
- Dezent: `bg-teal-50 border-teal-200 rounded-xl p-6`
- Kurzer Text + CTA Button

**5. Lead-Form**
- 2-Spalten: Benefits links, Formular rechts
- Card: `shadow-sm border rounded-2xl p-8`

**6. Methodologie**
- Zusammenklappbar (Accordion)

---

### Report-Seite (`/report/[id]`)

**1. Header**
- Breadcrumb: "Rankings > Cybersecurity > Unternehmen XY"
- Firmenname: `text-4xl font-semibold`
- Domain-Link: `text-teal-600`
- Beschreibung: `text-lg text-gray-600 max-w-3xl`

**2. Overall Score**
- Zentrierte hervorgehobene Card
- ScoreCircle: Dünnerer Stroke (6), kein Glow, dezenter Background-Ring
- Score: `text-5xl font-semibold` + Farblabel ("Gut"/"Mittel"/"Schwach")
- Kurze textliche Einordnung daneben

**3. Platform Breakdown**
- 4 Bars in einer Card
- Clean: Platform-Name + Icon, `rounded-full h-3` Bar mit solidem Fill, Score als Zahl
- Platform-spezifische Farben (solide, keine Gradienten)

**4. Stärken / Schwächen / Chancen**
- 3-Spalten Grid
- Farbcodierte Header (Emerald/Rose/Blue)
- Bullet-Listen

**5. Top Wettbewerber**
- Saubere Tabelle mit `divide-y`, alternating rows
- Spalten: Rang, Unternehmen, Nennungen, Score

**6. Handlungsempfehlungen**
- Nummerierte Cards, vertikal gestapelt
- Nummer-Badge (Teal) links, Inhalt rechts

**7. CTA / Lead-Form**
- 2-Spalten wie Ranking-Seite

---

## Was entfernt wird

- Alle `backdrop-blur` Effekte (außer Header)
- Alle `bg-white/X` Glasmorphism-Styles
- Ambient Gradient-Hintergründe (`blur-3xl` Circles)
- Cyan-Farbpalette → ersetzt durch Teal
- Space Grotesk Font → ersetzt durch Inter
- Übermäßige Gradient-Nutzung auf Cards
- Glow/Drop-Shadow auf ScoreCircle
- Dark-Only Design → Light + Dark Mode

## Was bleibt

- Score-Farblogik (Emerald/Yellow/Rose)
- Platform-Farbzuordnung
- Animierte ScoreCircle und PlatformBars (cleaner)
- Responsive Design-Ansatz (Mobile-first)
- Card-basiertes Layout
- Lead-Form Komponente (restyled)
- Grundlegende Seitenstruktur (3 Seiten)
