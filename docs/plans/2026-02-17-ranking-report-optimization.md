# Ranking & Report UX-Optimierung - Implementierungsplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Report- und Ranking-Seiten so überarbeiten, dass Nutzer die Analyse-Ergebnisse sofort verstehen - inspiriert von NexOrbit, aber mit eigenem Design.

**Architecture:** Das Backend liefert bereits reichhaltige Daten (query_results, sentiment, mention_rate, avg_position, platform_performance), die das Frontend nicht nutzt. Hauptarbeit: TypeScript-Typen erweitern, neue UI-Komponenten bauen, Report-Seite komplett überarbeiten. Kein Backend-Umbau nötig.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript

**Kontext-Dateien (vor jeder Task lesen):**
- `frontend/src/lib/api.ts` — TypeScript-Typen & API-Client
- `frontend/src/lib/utils.ts` — Farb- & Hilfs-Utilities
- `frontend/src/app/report/[id]/ReportPageClient.tsx` — Aktuelle Report-Seite
- `frontend/src/app/ranking/[industry]/RankingPageClient.tsx` — Aktuelle Ranking-Seite
- `frontend/src/components/` — Bestehende Komponenten (ScoreCircle, PlatformBar, RankingList, etc.)

**Design-System (durchgehend einhalten):**
- Light/Dark Mode: `bg-white dark:bg-[#1a1d27]`, Borders: `border-gray-200 dark:border-[#2e3039]`
- Akzent: Teal (`teal-600`/`teal-400`), Score-Farben: Emerald (≥70), Yellow (40-69), Rose (<40)
- Cards: `rounded-xl border shadow-sm`, Font: Inter, keine Emojis in UI
- Tailwind v4: `gap-*` statt `space-x-*`, `@custom-variant dark`

---

## Task 1: TypeScript-Typen erweitern

**Warum:** Das Backend liefert `query_results`, `sentiment_distribution`, `mention_rate`, `avg_position`, `platform_performance` etc. — aber die Frontend-Typen in `api.ts` bilden nur `strengths/weaknesses/opportunities` ab. Ohne korrekte Typen können wir die Daten nicht typsicher nutzen.

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Änderungen:**

Das bestehende `ScanInfo`-Interface ersetzen durch:

```typescript
export interface QueryResult {
  query: string;
  category: string;
  intent: string;
  platform: string;
  model: string;
  response_text: string;
  mentioned: boolean;
  mention_type: string;
  mention_count: number;
  position: number | null;
  context: string;
  sentiment: string;
  competitors_mentioned: string[];
}

export interface PlatformPerformance {
  mention_rate: number;
  total_queries: number;
  total_mentions: number;
}

export interface ScanAnalysis {
  total_queries: number;
  total_mentions: number;
  mention_rate: number;
  avg_position: number | null;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  top_competitors: Array<{ name: string; mentions: number }>;
  best_categories: string[];
  worst_categories: string[];
  platform_performance: Record<string, PlatformPerformance>;
}

export interface ScanInfo {
  id: string;
  overall_score: number;
  platform_scores: PlatformScores;
  query_results: QueryResult[];
  analysis: ScanAnalysis;
  competitors?: Array<{ name: string; mentions: number }>;
  started_at?: string;
  completed_at?: string;
}
```

**Verifizierung:**
- `cd frontend && npx tsc --noEmit` — Muss durchlaufen (Report-Seite nutzt `analysis.strengths` etc., also rückwärtskompatibel)
- Falls Typfehler: Zugriffe in ReportPageClient.tsx anpassen (z.B. `scan.analysis?.strengths` → `scan.analysis.strengths`)

**Commit:** `feat: extend TypeScript types for full scan analysis data`

---

## Task 2: InfoTooltip-Komponente

**Warum:** NexOrbit erklärt jede Kennzahl mit Tooltips. Unsere Nutzer verstehen nicht, was "Score 6.3" bedeutet. Ein wiederverwendbarer Tooltip löst das überall.

**Files:**
- Create: `frontend/src/components/InfoTooltip.tsx`

**Implementierung:**

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Info"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg z-50 leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
        </div>
      )}
    </div>
  );
}
```

**Verifizierung:** Visuell im Browser testen — Tooltip erscheint on hover/click.

**Commit:** `feat: add InfoTooltip component`

---

## Task 3: KPI-Karten-Sektion auf Report-Seite

**Warum:** Die wichtigsten Kennzahlen (Erwähnungsrate, Ø Position, Sentiment) müssen sofort sichtbar sein — nicht versteckt in Analyse-Text. Das ist der größte Quick-Win für Verständlichkeit.

**Files:**
- Create: `frontend/src/components/KpiCard.tsx`
- Modify: `frontend/src/app/report/[id]/ReportPageClient.tsx`

**KpiCard-Komponente:**

```tsx
import InfoTooltip from './InfoTooltip';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  tooltip: string;
  colorClass?: string;
}

export default function KpiCard({ label, value, subtitle, tooltip, colorClass = 'text-gray-900 dark:text-white' }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <InfoTooltip text={tooltip} />
      </div>
      <div className={`text-3xl font-semibold tabular-nums ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}
```

**Einbau in ReportPageClient.tsx — direkt nach dem ScoreCircle-Block:**

4 KPI-Karten in einem Grid:
1. **Erwähnungsrate** — `analysis.mention_rate` + `%` — Tooltip: "In wie vielen KI-Antworten wird Ihr Unternehmen erwähnt? Berechnet über alle Plattformen und Queries."
2. **Ø Position** — `analysis.avg_position` als `#X.X` — Tooltip: "Durchschnittliche Listenposition in KI-Antworten. Niedrigere Zahl = besser sichtbar."
3. **Queries analysiert** — `analysis.total_queries` — Tooltip: "Anzahl der branchenspezifischen Fragen, die an die KI-Plattformen gestellt wurden."
4. **Sentiment** — Prozent positiv aus `sentiment_distribution` — Tooltip: "Anteil der positiven Erwähnungen. Misst, wie vorteilhaft KI-Chatbots über Sie sprechen."

```tsx
{/* KPI Grid — nach ScoreCircle, vor Platform-Bars */}
<div className="mb-16">
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <KpiCard
      label="Erwähnungsrate"
      value={`${analysis.mention_rate.toFixed(0)}%`}
      subtitle={`${analysis.total_mentions} von ${analysis.total_queries} Antworten`}
      tooltip="In wie vielen KI-Antworten wird Ihr Unternehmen erwähnt? Berechnet über alle Plattformen und Queries."
      colorClass={analysis.mention_rate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : analysis.mention_rate >= 25 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400'}
    />
    <KpiCard
      label="Ø Position"
      value={analysis.avg_position ? `#${analysis.avg_position.toFixed(1)}` : '–'}
      subtitle="in KI-Antworten"
      tooltip="Durchschnittliche Listenposition wenn Ihr Unternehmen erwähnt wird. Niedrigere Zahl = prominenter platziert."
      colorClass={analysis.avg_position && analysis.avg_position <= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}
    />
    <KpiCard
      label="Queries analysiert"
      value={String(analysis.total_queries)}
      subtitle="branchenspezifische Fragen"
      tooltip="Anzahl der branchenspezifischen Fragen, die an ChatGPT, Claude, Gemini und Perplexity gestellt wurden."
    />
    <KpiCard
      label="Sentiment"
      value={(() => {
        const total = (analysis.sentiment_distribution?.positive ?? 0) + (analysis.sentiment_distribution?.neutral ?? 0) + (analysis.sentiment_distribution?.negative ?? 0);
        return total > 0 ? `${Math.round(((analysis.sentiment_distribution?.positive ?? 0) / total) * 100)}%` : '–';
      })()}
      subtitle="positiv"
      tooltip="Anteil positiver Erwähnungen. Zeigt, wie vorteilhaft KI-Chatbots über Ihr Unternehmen sprechen."
      colorClass="text-emerald-600 dark:text-emerald-400"
    />
  </div>
</div>
```

**Verifizierung:** Browser öffnen, `/report/{scan_id}` laden — 4 KPI-Karten müssen zwischen ScoreCircle und Platform-Bars sichtbar sein.

**Commit:** `feat: add KPI cards to report page`

---

## Task 4: Erweiterte Plattform-Aufschlüsselung

**Warum:** Aktuell zeigt PlatformBar nur den Score. Nutzer wollen auch wissen: "Wie oft wurde ich auf ChatGPT erwähnt?" — Die Daten existieren in `analysis.platform_performance`.

**Files:**
- Modify: `frontend/src/components/PlatformBar.tsx`

**Änderungen:**

PlatformBar erweitern um optionale `mentionRate` und `totalMentions`/`totalQueries` Props:

```tsx
interface PlatformBarProps {
  platform: string;
  score: number;
  maxScore?: number;
  mentionRate?: number;
  totalMentions?: number;
  totalQueries?: number;
}
```

Unter dem Bar eine Zeile mit Erwähnungsrate hinzufügen:

```tsx
{mentionRate !== undefined && (
  <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
    <span>{mentionRate.toFixed(0)}% erwähnt</span>
    {totalMentions !== undefined && totalQueries !== undefined && (
      <span>({totalMentions}/{totalQueries} Antworten)</span>
    )}
  </div>
)}
```

**Einbau in ReportPageClient.tsx:**

```tsx
<PlatformBar
  platform="chatgpt"
  score={scan.platform_scores.chatgpt}
  mentionRate={analysis.platform_performance?.chatgpt?.mention_rate}
  totalMentions={analysis.platform_performance?.chatgpt?.total_mentions}
  totalQueries={analysis.platform_performance?.chatgpt?.total_queries}
/>
```

Für alle 4 Plattformen wiederholen.

**Verifizierung:** Browser — PlatformBars zeigen jetzt zusätzlich "55% erwähnt (5/10 Antworten)".

**Commit:** `feat: show mention rate per platform in report`

---

## Task 5: Sentiment-Verteilung als visueller Balken

**Warum:** NexOrbit zeigt Sentiment prominent. Wir haben die Daten (`sentiment_distribution`), zeigen sie aber nicht.

**Files:**
- Create: `frontend/src/components/SentimentBar.tsx`
- Modify: `frontend/src/app/report/[id]/ReportPageClient.tsx`

**SentimentBar-Komponente:**

```tsx
import InfoTooltip from './InfoTooltip';

interface SentimentBarProps {
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentBar({ positive, neutral, negative }: SentimentBarProps) {
  const total = positive + neutral + negative;
  if (total === 0) return null;

  const pPct = (positive / total) * 100;
  const nPct = (neutral / total) * 100;
  const negPct = (negative / total) * 100;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sentiment-Verteilung</span>
        <InfoTooltip text="Wie werden Sie in KI-Antworten dargestellt? Positiv = empfehlend, Neutral = erwähnend, Negativ = kritisch." />
      </div>
      <div className="flex h-4 rounded-full overflow-hidden">
        {pPct > 0 && <div className="bg-emerald-500" style={{ width: `${pPct}%` }} />}
        {nPct > 0 && <div className="bg-gray-400" style={{ width: `${nPct}%` }} />}
        {negPct > 0 && <div className="bg-rose-500" style={{ width: `${negPct}%` }} />}
      </div>
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-emerald-600 dark:text-emerald-400">{positive} positiv</span>
        <span className="text-gray-500">{neutral} neutral</span>
        <span className="text-rose-600 dark:text-rose-400">{negative} negativ</span>
      </div>
    </div>
  );
}
```

**Einbau:** Im Report unter den Platform-Bars, innerhalb der gleichen Card:

```tsx
{analysis.sentiment_distribution && (
  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
    <SentimentBar
      positive={analysis.sentiment_distribution.positive}
      neutral={analysis.sentiment_distribution.neutral}
      negative={analysis.sentiment_distribution.negative}
    />
  </div>
)}
```

**Verifizierung:** Browser — Farbiger Balken unter den Platform-Bars sichtbar.

**Commit:** `feat: add sentiment distribution bar to report`

---

## Task 6: Query-Transparenz-Tabelle

**Warum:** Das ist der größte Differenzierungsfaktor. Nutzer sehen exakt, welche Fragen gestellt wurden und wo sie erwähnt werden. NexOrbit zeigt das — wir nicht. Die Daten existieren komplett in `scan.query_results[]`.

**Files:**
- Create: `frontend/src/components/QueryTable.tsx`
- Modify: `frontend/src/app/report/[id]/ReportPageClient.tsx`

**QueryTable-Komponente:**

```tsx
'use client';

import { useState, useMemo } from 'react';
import type { QueryResult } from '@/lib/api';
import { platformNames, platformColors } from '@/lib/utils';
import InfoTooltip from './InfoTooltip';

interface QueryTableProps {
  queries: QueryResult[];
}

type FilterPlatform = 'all' | 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
type FilterMentioned = 'all' | 'yes' | 'no';

function PlatformDot({ platform }: { platform: string }) {
  const bgClass = platformColors[platform] || 'bg-gray-500';
  const name = platformNames[platform] || platform;
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${bgClass}`} title={name} />
  );
}

export default function QueryTable({ queries }: QueryTableProps) {
  const [platformFilter, setPlatformFilter] = useState<FilterPlatform>('all');
  const [mentionFilter, setMentionFilter] = useState<FilterMentioned>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return queries.filter((q) => {
      if (platformFilter !== 'all' && q.platform !== platformFilter) return false;
      if (mentionFilter === 'yes' && !q.mentioned) return false;
      if (mentionFilter === 'no' && q.mentioned) return false;
      return true;
    });
  }, [queries, platformFilter, mentionFilter]);

  // Group by unique query text
  const grouped = useMemo(() => {
    const map = new Map<string, QueryResult[]>();
    filtered.forEach((q) => {
      const existing = map.get(q.query) || [];
      existing.push(q);
      map.set(q.query, existing);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const sentimentIcon = (s: string) => {
    if (s === 'positive') return <span className="text-emerald-500" title="Positiv">&#9650;</span>;
    if (s === 'negative') return <span className="text-rose-500" title="Negativ">&#9660;</span>;
    return <span className="text-gray-400" title="Neutral">&#9679;</span>;
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Analysierte Suchanfragen</h2>
        <InfoTooltip text="Diese Fragen wurden an die KI-Plattformen gestellt, um zu messen, ob und wie Ihr Unternehmen empfohlen wird." />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'chatgpt', 'claude', 'gemini', 'perplexity'] as FilterPlatform[]).map((p) => (
          <button key={p} onClick={() => setPlatformFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              platformFilter === p
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {p === 'all' ? 'Alle Plattformen' : platformNames[p]}
          </button>
        ))}
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />
        {(['all', 'yes', 'no'] as FilterMentioned[]).map((m) => (
          <button key={m} onClick={() => setMentionFilter(m)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mentionFilter === m
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {m === 'all' ? 'Alle' : m === 'yes' ? 'Erwähnt' : 'Nicht erwähnt'}
          </button>
        ))}
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {filtered.length} Ergebnis{filtered.length !== 1 ? 'se' : ''} von {queries.length}
      </div>

      {/* Query List */}
      <div className="space-y-2">
        {grouped.map(([queryText, results], idx) => {
          const anyMentioned = results.some((r) => r.mentioned);
          const isExpanded = expandedIndex === idx;

          return (
            <div key={idx} className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${anyMentioned ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">"{queryText}"</p>
                  <div className="flex items-center gap-2 mt-2">
                    {results.map((r, i) => <PlatformDot key={i} platform={r.platform} />)}
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {results.map((r, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-4">
                      <PlatformDot platform={r.platform} />
                      <span className="text-sm text-gray-600 dark:text-gray-300 w-20">{platformNames[r.platform]}</span>
                      <span className={`text-sm font-medium ${r.mentioned ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                        {r.mentioned ? `Pos. ${r.position ?? '–'}` : 'Nicht erwähnt'}
                      </span>
                      {r.mentioned && sentimentIcon(r.sentiment)}
                      {r.context && r.mentioned && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">...{r.context.slice(0, 120)}...</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Einbau in ReportPageClient.tsx — als neue Sektion nach "Detaillierte Analyse":**

```tsx
{scan.query_results && scan.query_results.length > 0 && (
  <div className="mb-16">
    <QueryTable queries={scan.query_results} />
  </div>
)}
```

**Verifizierung:**
- Browser — Filterbare Query-Liste mit Platform-Dots sichtbar
- Klick auf Query expandiert Detail-Ansicht pro Plattform
- Filter funktionieren (Plattform + Erwähnt/Nicht erwähnt)

**Commit:** `feat: add query transparency table to report page`

---

## Task 7: Wettbewerber-Vergleich visuell aufwerten

**Warum:** Aktuell nur eine nüchterne Tabelle mit Name + Nennungen. NexOrbit zeigt horizontale Balken mit relativem Vergleich. Unsere `top_competitors`-Daten in `analysis` ermöglichen das.

**Files:**
- Modify: `frontend/src/app/report/[id]/ReportPageClient.tsx`

**Änderungen:** Den bestehenden Competitors-Abschnitt ersetzen. Statt `<table>` eine visuelle Balkendarstellung:

```tsx
{analysis.top_competitors && analysis.top_competitors.length > 0 && (
  <div className="mb-16">
    <div className="flex items-center gap-1.5 mb-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Wettbewerber im Vergleich</h2>
      <InfoTooltip text="Wie oft werden Ihre Wettbewerber in KI-Antworten zu den gleichen Fragen erwähnt?" />
    </div>
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6 shadow-sm">
      {/* Eigenes Unternehmen zuerst */}
      <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{company.name} (Sie)</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{analysis.total_mentions} Erwähnungen</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min((analysis.total_mentions / analysis.total_queries) * 100, 100)}%` }} />
        </div>
      </div>
      {/* Wettbewerber */}
      <div className="space-y-3">
        {analysis.top_competitors.slice(0, 8).map((c, i) => {
          const maxMentions = Math.max(analysis.total_mentions, ...analysis.top_competitors.map(tc => tc.mentions));
          const widthPct = maxMentions > 0 ? (c.mentions / maxMentions) * 100 : 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{c.mentions}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 dark:bg-gray-500 rounded-full" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}
```

**Verifizierung:** Browser — Eigenes Unternehmen mit Teal-Balken oben, Wettbewerber mit grauen Balken darunter.

**Commit:** `feat: visual competitor comparison bars in report`

---

## Task 8: Tooltips zu bestehenden Komponenten hinzufügen

**Warum:** Auch die vorhandenen Sektionen (ScoreCircle, PlatformBar, Stärken/Schwächen/Chancen) brauchen Kontext-Erklärungen.

**Files:**
- Modify: `frontend/src/app/report/[id]/ReportPageClient.tsx`

**Änderungen — Tooltips zu Sektions-Headern:**

1. **Gesamt-Score** — über ScoreCircle:
   ```tsx
   <div className="flex items-center justify-center gap-1.5 mb-4">
     <span className="text-sm text-gray-500 dark:text-gray-400">Gesamt-Score</span>
     <InfoTooltip text="Gewichteter Durchschnitt Ihrer Sichtbarkeit über alle KI-Plattformen. Gewichtung: ChatGPT 35%, Claude 35%, Gemini 30%." />
   </div>
   ```

2. **Performance nach Plattform:**
   ```tsx
   <div className="flex items-center gap-1.5 mb-6">
     <h2 className="text-2xl font-semibold ...">Performance nach Plattform</h2>
     <InfoTooltip text="Score pro KI-Plattform: 0 = nie erwähnt, 100 = in jeder Antwort an prominenter Stelle positiv empfohlen." />
   </div>
   ```

3. **Detaillierte Analyse:**
   ```tsx
   <div className="flex items-center gap-1.5 mb-6">
     <h2 className="text-2xl font-semibold ...">Detaillierte Analyse</h2>
     <InfoTooltip text="Automatisch erkannte Stärken, Schwächen und Chancen basierend auf der Auswertung aller KI-Antworten." />
   </div>
   ```

4. **Handlungsempfehlungen:**
   ```tsx
   <div className="flex items-center gap-1.5 mb-6">
     <h2 className="text-2xl font-semibold ...">Handlungsempfehlungen</h2>
     <InfoTooltip text="Konkrete Maßnahmen um Ihre Sichtbarkeit in KI-Chatbots zu verbessern, priorisiert nach erwartetem Impact." />
   </div>
   ```

**Verifizierung:** Browser — Info-Icons neben allen Sektionsüberschriften sichtbar, Tooltip erscheint bei Hover.

**Commit:** `feat: add tooltips to all report sections`

---

## Task 9: Ranking-Seite — Plattform-Aufschlüsselung pro Eintrag

**Warum:** Die Ranking-Liste zeigt nur den Gesamtscore. Nutzer wollen auf einen Blick sehen, auf welcher Plattform ein Unternehmen stark/schwach ist.

**Files:**
- Modify: `frontend/src/components/RankingList.tsx`

**Änderungen an RankingCard:**

Unter dem Company-Namen und der Domain eine kompakte Plattform-Score-Leiste hinzufügen:

```tsx
{/* Innerhalb von RankingCard, nach dem Domain-Text */}
<div className="flex items-center gap-3 mt-2">
  {Object.entries(entry.platform_scores).map(([platform, score]) => {
    const name = platform === 'chatgpt' ? 'GPT' : platform === 'claude' ? 'CL' : platform === 'gemini' ? 'GEM' : 'PPX';
    const colorClass = score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : score >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400';
    return (
      <span key={platform} className="text-xs text-gray-400">
        {name} <span className={`font-semibold tabular-nums ${colorClass}`}>{score.toFixed(0)}</span>
      </span>
    );
  })}
</div>
```

**Verifizierung:** Browser — Unter jedem Unternehmen eine Zeile mit "GPT 42 CL 58 GEM 31 PPX 0".

**Commit:** `feat: show platform breakdown in ranking cards`

---

## Task 10: Report-Seite — Gesamtlayout neu ordnen

**Warum:** Die Reihenfolge der Sektionen muss dem Nutzerfluss folgen: Überblick → Detail → Aktion. Aktuell: ScoreCircle → PlatformBars → SWOT → Wettbewerber → Empfehlungen → LeadForm. Besser:

**Neue Reihenfolge:**
1. Header (Name, Domain, Beschreibung)
2. **KPI-Grid** (4 Karten: Erwähnungsrate, Ø Position, Queries, Sentiment) — Task 3
3. **ScoreCircle + PlatformBars + Sentiment** zusammen in einer Card
4. **Wettbewerber-Vergleich** (visuelle Balken) — Task 7
5. **Suchanfragen** (Query-Tabelle mit Filter) — Task 6
6. **SWOT-Analyse** (Stärken/Schwächen/Chancen)
7. **Empfehlungen**
8. **Lead-Form CTA**

**Files:**
- Modify: `frontend/src/app/report/[id]/ReportPageClient.tsx`

**Änderungen:**

ScoreCircle und PlatformBars in eine gemeinsame Card verpacken:

```tsx
<div className="mb-16 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl p-8 shadow-sm">
  <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
    <ScoreCircle score={scan.overall_score} size={180} label="Gesamt-Score" />
    <div className="space-y-5">
      <PlatformBar platform="chatgpt" score={scan.platform_scores.chatgpt} ... />
      <PlatformBar platform="claude" score={scan.platform_scores.claude} ... />
      <PlatformBar platform="gemini" score={scan.platform_scores.gemini} ... />
      <PlatformBar platform="perplexity" score={scan.platform_scores.perplexity} ... />
      {analysis.sentiment_distribution && (
        <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
          <SentimentBar ... />
        </div>
      )}
    </div>
  </div>
</div>
```

Die Sektionen in der neuen Reihenfolge anordnen (keine neuen Komponenten, nur Reorder des JSX).

**Verifizierung:** Browser — Score-Kreis links, Platform-Bars rechts daneben, Sentiment darunter. Logischer Fluss von oben nach unten.

**Commit:** `feat: reorganize report page layout for better flow`

---

## Task 11: Ranking-Seite — Tooltips und Erklärungen

**Warum:** Auch die Ranking-Seite braucht Kontext. "Score 6.3" sagt einem Laien nichts.

**Files:**
- Modify: `frontend/src/app/ranking/[industry]/RankingPageClient.tsx`
- Modify: `frontend/src/components/RankingList.tsx`

**Änderungen:**

1. **Methodik-Erklärung prominenter platzieren** — Die `<details>` Accordion am Ende der Ranking-Seite nach oben verschieben, direkt unter die Meta-Badges:

```tsx
<p className="text-sm text-gray-500 dark:text-gray-400 mt-4 max-w-2xl">
  Basierend auf {ranking.total_companies} automatisierten Analysen über ChatGPT, Claude, Gemini und Perplexity.
  Jedes Unternehmen wird mit branchenspezifischen Fragen getestet. <button onClick={() => ...} className="text-teal-600 dark:text-teal-400 hover:underline">Methodik →</button>
</p>
```

2. **Score-Label im RankingCard** — Neben dem Score-Wert ein Label anzeigen (Gut/Mittel/Schwach):

In `ScoreBlock` nach dem Score-Wert:
```tsx
import { getScoreLabel } from '@/lib/utils';
// ...
<div className="mt-2 text-[10px] uppercase tracking-[0.24em] text-gray-400">
  {getScoreLabel(safeScore)}
</div>
```

**Verifizierung:** Browser — Methodik direkt sichtbar, Scores mit Label.

**Commit:** `feat: add context and labels to ranking page`

---

## Task 12: Umlaute korrigieren

**Warum:** Alle deutschen Texte nutzen `ue`, `ae`, `oe` statt echte Umlaute (ü, ä, ö). Das wirkt unprofessionell.

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/ranking/[industry]/RankingPageClient.tsx`
- Modify: `frontend/src/app/report/[id]/ReportPageClient.tsx`
- Modify: `frontend/src/components/LeadForm.tsx`
- Modify: `frontend/src/components/RankingList.tsx`
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/components/Footer.tsx`

**Änderungen:**

Suche-und-ersetze in allen Frontend-Dateien:
- `ue` → `ü` (Kontext-abhängig: "ueber" → "über", "fuer" → "für", etc.)
- `ae` → `ä` ("Staerken" → "Stärken", "Schwaechen" → "Schwächen")
- `oe` → `ö` ("Loesungen" → "Lösungen")
- `ss` → `ß` wo angebracht ("massgeschneidert" → "maßgeschneidert")

**Achtung:** Nur in sichtbaren Textstrings ändern, NICHT in CSS-Klassennamen, Variablen oder Code!

**Verifizierung:** Browser — Alle deutschen Texte mit korrekten Umlauten.

**Commit:** `fix: use proper German umlauts in all UI text`

---

## Zusammenfassung der Optimierungen

| # | Task | Impact | Aufwand |
|---|------|--------|---------|
| 1 | TypeScript-Typen erweitern | Foundation für alles | Klein |
| 2 | InfoTooltip-Komponente | Wiederverwendbar überall | Klein |
| 3 | KPI-Karten (Report) | Sofortiges Verständnis der Key Metrics | Mittel |
| 4 | Platform-Bars mit Mention-Rate | Tiefere Plattform-Insights | Klein |
| 5 | Sentiment-Balken | Emotion der KI-Antworten sichtbar | Klein |
| 6 | Query-Transparenz-Tabelle | **Größter Differenzierungsfaktor** | Groß |
| 7 | Wettbewerber-Vergleich visuell | Sofort klarer Benchmark | Mittel |
| 8 | Tooltips überall | Nutzer versteht jede Kennzahl | Klein |
| 9 | Ranking: Plattform-Scores | Schneller Überblick pro Unternehmen | Klein |
| 10 | Report: Layout-Reorder | Besserer Informationsfluss | Mittel |
| 11 | Ranking: Kontext & Labels | Methodik transparent | Klein |
| 12 | Umlaute korrigieren | Professionalität | Klein |
