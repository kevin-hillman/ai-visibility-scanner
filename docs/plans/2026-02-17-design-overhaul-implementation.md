# Design Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual redesign from dark glassmorphism to clean "Stripe-Warm" aesthetic with Light+Dark mode, Teal accent, Inter font.

**Architecture:** Restyle all existing components in-place. Add ThemeProvider for dark mode toggle with `class`-based switching. Replace all glassmorphism/cyan/dark-only styles with the new design system. No new pages or API changes needed.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Inter (Google Fonts)

**Design Doc:** `docs/plans/2026-02-17-design-overhaul.md`

---

## Task 1: Dark Mode Infrastructure

**Files:**
- Create: `frontend/src/components/ThemeProvider.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1: Create ThemeProvider component**

Create `frontend/src/components/ThemeProvider.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Step 2: Replace globals.css completely**

Replace `frontend/src/app/globals.css` with:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

/* Light mode (default) */
body {
  background: #ffffff;
  color: #111827;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Dark mode */
.dark body {
  background: #0f1117;
  color: #f3f4f6;
}

/* Custom scrollbar — Light */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f9fafb;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Custom scrollbar — Dark */
.dark ::-webkit-scrollbar-track {
  background: #0f1117;
}

.dark ::-webkit-scrollbar-thumb {
  background: #374151;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}

/* Selection */
::selection {
  background: rgba(13, 148, 136, 0.2);
}

.dark ::selection {
  background: rgba(45, 212, 191, 0.25);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}

/* Dot grid pattern for hero sections */
.dot-grid {
  background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px);
  background-size: 24px 24px;
}

.dark .dot-grid {
  background-image: radial-gradient(circle, #374151 1px, transparent 1px);
  background-size: 24px 24px;
}
```

**Step 3: Update layout.tsx — swap font to Inter, add ThemeProvider**

Replace `frontend/src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThemeProvider from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GEO Intelligence Engine - KI-Sichtbarkeit messen & optimieren',
  description: 'Messen Sie die KI-Sichtbarkeit Ihres Unternehmens über ChatGPT, Claude, Gemini und Perplexity. Professionelles GEO/SEO-Consulting für den DACH-Raum.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-white dark:bg-[#0f1117] text-gray-900 dark:text-gray-100`}>
        <ThemeProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Step 4: Verify dev server starts**

Run: `cd frontend && npm run dev`
Expected: Server starts without errors. Page loads in light mode by default.

**Step 5: Commit**

```bash
git add frontend/src/components/ThemeProvider.tsx frontend/src/app/layout.tsx frontend/src/app/globals.css
git commit -m "feat: add dark mode infrastructure with ThemeProvider, Inter font, new globals.css"
```

---

## Task 2: Update Utility Functions

**Files:**
- Modify: `frontend/src/lib/utils.ts`

**Step 1: Update utils.ts for light+dark mode colors**

Replace `frontend/src/lib/utils.ts` entirely with:

```ts
// Score color utilities — work in both light and dark mode
export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-50 dark:bg-emerald-500/20';
  if (score >= 40) return 'bg-yellow-50 dark:bg-yellow-500/20';
  return 'bg-rose-50 dark:bg-rose-500/20';
}

export function getScoreBorderColor(score: number): string {
  if (score >= 70) return 'border-emerald-200 dark:border-emerald-500/40';
  if (score >= 40) return 'border-yellow-200 dark:border-yellow-500/40';
  return 'border-rose-200 dark:border-rose-500/40';
}

export function getScoreGradient(score: number): string {
  if (score >= 70) return 'from-emerald-500 to-emerald-600';
  if (score >= 40) return 'from-yellow-500 to-yellow-600';
  return 'from-rose-500 to-rose-600';
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Gut';
  if (score >= 40) return 'Mittel';
  return 'Schwach';
}

// Rank badge colors
export function getRankBadgeColor(rank: number): string {
  if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/40';
  if (rank === 2) return 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500/40';
  if (rank === 3) return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
}

// Format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Platform display names
export const platformNames: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
};

// Platform colors — solid colors, no gradients
export const platformColors: Record<string, string> = {
  chatgpt: 'bg-emerald-500',
  claude: 'bg-orange-500',
  gemini: 'bg-blue-500',
  perplexity: 'bg-violet-500',
};

// Platform text colors for labels
export const platformTextColors: Record<string, string> = {
  chatgpt: 'text-emerald-600 dark:text-emerald-400',
  claude: 'text-orange-600 dark:text-orange-400',
  gemini: 'text-blue-600 dark:text-blue-400',
  perplexity: 'text-violet-600 dark:text-violet-400',
};
```

**Step 2: Commit**

```bash
git add frontend/src/lib/utils.ts
git commit -m "feat: update color utilities for light+dark mode, add solid platform colors"
```

---

## Task 3: Redesign Header

**Files:**
- Modify: `frontend/src/components/Header.tsx`

**Step 1: Rewrite Header.tsx completely**

Replace with new design: sticky, light background, dark mode toggle, teal accents, no glassmorphism.

```tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchIndustries, Industry } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';

export default function Header() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchIndustries()
      .then(setIndustries)
      .catch(console.error);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-sm border-b border-gray-200 dark:border-[#2e3039]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              GEO Intelligence
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="relative">
              <button
                onClick={() => setIsIndustriesOpen(!isIndustriesOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center space-x-1"
              >
                <span>Branchen</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isIndustriesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isIndustriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl shadow-lg overflow-hidden">
                  {industries.map((industry) => (
                    <Link
                      key={industry.id}
                      href={`/ranking/${industry.id}`}
                      onClick={() => setIsIndustriesOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-[#2e3039] last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{industry.display_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{industry.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/ranking/cybersecurity" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Rankings
            </Link>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Theme umschalten"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link
              href="#contact"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
            >
              Kontakt
            </Link>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Theme umschalten"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-[#2e3039]">
            <div className="flex flex-col space-y-1">
              <div className="text-gray-400 text-sm font-medium px-2 py-2 uppercase tracking-wide">Branchen</div>
              {industries.map((industry) => (
                <Link
                  key={industry.id}
                  href={`/ranking/${industry.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {industry.display_name}
                </Link>
              ))}
              <Link
                href="/ranking/cybersecurity"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Rankings
              </Link>
              <Link
                href="#contact"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
              >
                Kontakt
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Header.tsx
git commit -m "feat: redesign Header with light/dark mode, teal accent, theme toggle"
```

---

## Task 4: Redesign Footer

**Files:**
- Modify: `frontend/src/components/Footer.tsx`

**Step 1: Rewrite Footer.tsx — compact, clean**

```tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-[#1a1d27] border-t border-gray-200 dark:border-[#2e3039] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo + tagline */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">GEO Intelligence</span>
            <span className="text-sm text-gray-400">—</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">KI-Sichtbarkeit messen</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm">
            <Link href="/datenschutz" className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Datenschutz
            </Link>
            <Link href="/impressum" className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Impressum
            </Link>
            <Link href="/agb" className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              AGB
            </Link>
            <a href="mailto:info@geo-intelligence.de" className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Kontakt
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2e3039] text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} GEO Intelligence Engine. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Footer.tsx
git commit -m "feat: redesign Footer — compact single-row layout, light/dark support"
```

---

## Task 5: Redesign ScoreCircle

**Files:**
- Modify: `frontend/src/components/ScoreCircle.tsx`

**Step 1: Rewrite ScoreCircle — thinner stroke, no glow, score label**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getScoreColor, getScoreLabel } from '@/lib/utils';

interface ScoreCircleProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ScoreCircle({ score, size = 200, label }: ScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = score / 60;
      const interval = setInterval(() => {
        current += increment;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(interval);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, 16);

      return () => clearInterval(interval);
    }, 100);

    return () => clearTimeout(timer);
  }, [score]);

  const scoreColorClass = getScoreColor(score);
  const strokeColor = score >= 70 ? '#10b981' : score >= 40 ? '#eab308' : '#f43f5e';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-800"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-5xl font-semibold ${scoreColorClass}`}>
            {animatedScore}
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">von 100</div>
        </div>
      </div>

      {label && (
        <div className="mt-4 text-center">
          <div className="text-gray-600 dark:text-gray-300 font-medium">{label}</div>
          <div className={`text-sm font-medium mt-1 ${scoreColorClass}`}>
            {getScoreLabel(score)}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/ScoreCircle.tsx
git commit -m "feat: redesign ScoreCircle — thinner stroke, no glow, score label"
```

---

## Task 6: Redesign PlatformBar

**Files:**
- Modify: `frontend/src/components/PlatformBar.tsx`

**Step 1: Rewrite PlatformBar — solid colors, rounded-full h-3, cleaner**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { platformColors, platformNames, platformTextColors } from '@/lib/utils';

interface PlatformBarProps {
  platform: string;
  score: number;
  maxScore?: number;
}

export default function PlatformBar({ platform, score, maxScore = 100 }: PlatformBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = (score / maxScore) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const bgClass = platformColors[platform] || 'bg-gray-500';
  const textClass = platformTextColors[platform] || 'text-gray-600 dark:text-gray-400';
  const displayName = platformNames[platform] || platform;

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 text-right">
        <span className={`font-medium text-sm ${textClass}`}>{displayName}</span>
      </div>

      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3 relative overflow-hidden">
        <div
          className={`h-full ${bgClass} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>

      <div className="w-10 text-right">
        <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{score}</span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/PlatformBar.tsx
git commit -m "feat: redesign PlatformBar — solid colors, thin rounded bars, clean layout"
```

---

## Task 7: Redesign RecommendationCard

**Files:**
- Modify: `frontend/src/components/RecommendationCard.tsx`

**Step 1: Rewrite RecommendationCard — teal number badge, border card, no glassmorphism**

```tsx
interface RecommendationCardProps {
  index: number;
  text: string;
}

export default function RecommendationCard({ index, text }: RecommendationCardProps) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-semibold text-sm">
            {index}
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/RecommendationCard.tsx
git commit -m "feat: redesign RecommendationCard — clean border card with teal badge"
```

---

## Task 8: Redesign LeadForm

**Files:**
- Modify: `frontend/src/components/LeadForm.tsx`

**Step 1: Rewrite LeadForm — clean inputs, teal buttons, light/dark support**

```tsx
'use client';

import { useState } from 'react';
import { submitLead, LeadData } from '@/lib/api';

interface LeadFormProps {
  industryId?: string;
  sourcePage?: string;
  prefill?: {
    company_name?: string;
    message?: string;
  };
}

export default function LeadForm({ industryId, sourcePage, prefill }: LeadFormProps) {
  const [formData, setFormData] = useState(() => ({
    name: '',
    email: '',
    company_name: prefill?.company_name || '',
    phone: '',
    message: prefill?.message || '',
  }));

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const leadData: LeadData = {
        ...formData,
        industry_id: industryId,
        source_page: sourcePage,
      };

      await submitLead(leadData);
      setStatus('success');
      setFormData({ name: '', email: '', company_name: '', phone: '', message: '' });
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass = 'w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';

  if (status === 'success') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-8 text-center">
        <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Vielen Dank!</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Wir haben Ihre Anfrage erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
        >
          Weitere Anfrage senden
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg p-4 text-rose-700 dark:text-rose-400 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name <span className="text-rose-500">*</span>
          </label>
          <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="Max Mustermann" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            E-Mail <span className="text-rose-500">*</span>
          </label>
          <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="max@unternehmen.de" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Unternehmen
          </label>
          <input type="text" id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} className={inputClass} placeholder="Ihre Firma GmbH" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telefon
          </label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+49 123 456789" />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ihre Nachricht
        </label>
        <textarea id="message" name="message" rows={4} value={formData.message} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Beschreiben Sie kurz Ihr Anliegen..." />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {status === 'submitting' ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Wird gesendet...</span>
          </>
        ) : (
          <span>Kostenlose Erstberatung anfordern</span>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Mit dem Absenden stimmen Sie unserer Datenschutzerklaerung zu.
      </p>
    </form>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/LeadForm.tsx
git commit -m "feat: redesign LeadForm — clean inputs, teal accents, light/dark mode"
```

---

## Task 9: Redesign RankingList

**Files:**
- Modify: `frontend/src/components/RankingList.tsx`

**Step 1: Rewrite RankingList.tsx — clean cards, no glassmorphism, teal CTAs**

Replace the entire file. Key changes:
- RankingCard: white bg, border, shadow-sm, hover:shadow-md
- MidPageCtaCard: teal-50 bg, clean teal border
- Search input: clean light/dark style
- Remove all `bg-white/X`, `backdrop-blur`, gradient backgrounds

```tsx
'use client';

import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import type { RankingEntry } from '@/lib/api';
import { getRankBadgeColor } from '@/lib/utils';

type RankingListProps = {
  entries: RankingEntry[];
  onRequestScan: (entry?: Pick<RankingEntry, 'company_name' | 'domain'>) => void;
};

function ScoreBlock({ score }: { score: number }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const colorClass = safeScore >= 70
    ? 'text-emerald-600 dark:text-emerald-400'
    : safeScore >= 40
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="text-right leading-none">
      <div className={`text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${colorClass}`}>
        {safeScore.toFixed(1)}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.24em] text-gray-400">Score</div>
    </div>
  );
}

function MidPageCtaCard({ onRequestScan }: { onRequestScan: RankingListProps['onRequestScan'] }) {
  return (
    <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/10 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <svg className="h-5 w-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 14l3-3 4 4 7-7" />
            </svg>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Starte dein eigenes KI-Tracking
            </h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">
              Multi-Client Dashboard mit Updates, Reports und Empfehlungen.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRequestScan()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 px-5 py-2.5 font-medium text-white transition-colors"
        >
          Mehr erfahren
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function RankingCard({
  entry,
  onRequestScan,
}: {
  entry: RankingEntry;
  onRequestScan: RankingListProps['onRequestScan'];
}) {
  const reportHref = entry.scan_id ? `/report/${entry.scan_id}` : null;

  return (
    <div className="group bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl px-4 py-4 sm:px-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`shrink-0 inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-bold tabular-nums text-sm ${getRankBadgeColor(entry.rank)}`}
            aria-label={`Rang ${entry.rank}`}
          >
            {entry.rank}
          </div>

          <div className="min-w-0">
            {reportHref ? (
              <Link
                href={reportHref}
                className="block text-base sm:text-lg font-semibold text-gray-900 dark:text-white tracking-tight truncate hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {entry.company_name}
              </Link>
            ) : (
              <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white tracking-tight truncate">
                {entry.company_name}
              </div>
            )}
            <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
              {entry.domain}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
          <ScoreBlock score={entry.overall_score} />

          {reportHref ? (
            <Link
              href={reportHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label={`Report oeffnen fuer ${entry.company_name}`}
            >
              Report
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onRequestScan({ company_name: entry.company_name, domain: entry.domain })}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2.5 font-medium text-white transition-colors"
              aria-label={`Scan anfordern fuer ${entry.company_name}`}
            >
              Scan anfordern
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RankingList({ entries, onRequestScan }: RankingListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.rank - b.rank);
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter(
      (entry) =>
        entry.company_name.toLowerCase().includes(term) || entry.domain.toLowerCase().includes(term)
    );
  }, [entries, searchTerm]);

  const shouldShowCta = searchTerm.trim() === '';
  const insertMidCta = shouldShowCta && filteredEntries.length > 4;

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          placeholder="Unternehmen oder Domain suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
        />
        <svg
          className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <ol className="space-y-3">
        {filteredEntries.map((entry, index) => (
          <Fragment key={`${entry.domain}-${entry.rank}`}>
            {insertMidCta && index === 4 && (
              <li className="animate-fadeIn" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                <MidPageCtaCard onRequestScan={onRequestScan} />
              </li>
            )}
            <li
              className="animate-fadeIn"
              style={{ animationDelay: `${Math.min(index, 10) * 60}ms`, animationFillMode: 'both' }}
            >
              <RankingCard entry={entry} onRequestScan={onRequestScan} />
            </li>
          </Fragment>
        ))}
      </ol>

      {shouldShowCta && filteredEntries.length <= 4 && (
        <MidPageCtaCard onRequestScan={onRequestScan} />
      )}

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Keine Unternehmen gefunden. Versuchen Sie einen anderen Suchbegriff.
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/RankingList.tsx
git commit -m "feat: redesign RankingList — clean cards, teal accents, no glassmorphism"
```

---

## Task 10: Redesign RankingTable

**Files:**
- Modify: `frontend/src/components/RankingTable.tsx`

**Step 1: Update RankingTable — light/dark colors, clean borders**

Key changes: Replace all `bg-white/X`, `border-white/X`, `text-cyan-400` with proper light/dark classes. Use `divide-y divide-gray-200 dark:divide-gray-800`, `hover:bg-gray-50 dark:hover:bg-gray-800`, teal instead of cyan.

Replace the entire file with the same structure but updated classes. The sort icons should use `text-teal-600 dark:text-teal-400` instead of `text-cyan-400`. Table rows: `border-b border-gray-100 dark:border-gray-800`. Search input: same style as RankingList. Mobile cards: `bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039]`.

```tsx
'use client';

import { useState, useMemo } from 'react';
import { RankingEntry } from '@/lib/api';
import { getScoreColor, getScoreBgColor, getScoreBorderColor, getRankBadgeColor } from '@/lib/utils';

interface RankingTableProps {
  entries: RankingEntry[];
  onRowClick: (entry: RankingEntry) => void;
}

type SortField = 'rank' | 'company_name' | 'overall_score' | 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
type SortOrder = 'asc' | 'desc';

function SortIcon({ field, sortField, sortOrder }: { field: SortField; sortField: SortField; sortOrder: SortOrder }) {
  if (sortField !== field) {
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }

  return sortOrder === 'asc' ? (
    <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function RankingTable({ entries, onRowClick }: RankingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const filteredAndSortedEntries = useMemo(() => {
    const filtered = entries.filter(
      (entry) =>
        entry.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      if (sortField === 'company_name') {
        aValue = a.company_name.toLowerCase();
        bValue = b.company_name.toLowerCase();
      } else if (sortField === 'rank' || sortField === 'overall_score') {
        aValue = a[sortField];
        bValue = b[sortField];
      } else {
        aValue = a.platform_scores[sortField];
        bValue = b.platform_scores[sortField];
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [entries, searchTerm, sortField, sortOrder]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Unternehmen oder Domain suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <svg
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#2e3039]">
              {(['rank', 'company_name'] as SortField[]).map((field) => (
                <th key={field} className="text-left py-4 px-4">
                  <button
                    onClick={() => handleSort(field)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                  >
                    <span>{field === 'rank' ? 'Rang' : 'Unternehmen'}</span>
                    <SortIcon field={field} sortField={sortField} sortOrder={sortOrder} />
                  </button>
                </th>
              ))}
              <th className="text-left py-4 px-4">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Domain</span>
              </th>
              {(['overall_score', 'chatgpt', 'claude', 'gemini', 'perplexity'] as SortField[]).map((field) => (
                <th key={field} className="text-center py-4 px-4">
                  <button
                    onClick={() => handleSort(field)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mx-auto text-sm font-medium"
                  >
                    <span>{field === 'overall_score' ? 'Gesamt' : field.charAt(0).toUpperCase() + field.slice(1)}</span>
                    <SortIcon field={field} sortField={sortField} sortOrder={sortOrder} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEntries.map((entry) => (
              <tr
                key={`${entry.domain}-${entry.rank}`}
                onClick={() => onRowClick(entry)}
                className="border-b border-gray-100 dark:border-[#2e3039] hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
                    {entry.rank}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {entry.company_name}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-gray-500 dark:text-gray-400 text-sm">{entry.domain}</div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-flex items-center justify-center w-16 h-8 rounded-lg font-bold text-sm ${getScoreBgColor(entry.overall_score)} ${getScoreColor(entry.overall_score)} border ${getScoreBorderColor(entry.overall_score)}`}>
                    {entry.overall_score}
                  </span>
                </td>
                {(['chatgpt', 'claude', 'gemini', 'perplexity'] as const).map((platform) => (
                  <td key={platform} className="py-4 px-4 text-center">
                    <span className={`${getScoreColor(entry.platform_scores[platform])} font-semibold text-sm`}>
                      {entry.platform_scores[platform]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredAndSortedEntries.map((entry) => (
          <div
            key={`${entry.domain}-${entry.rank}`}
            onClick={() => onRowClick(entry)}
            className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white text-lg">{entry.company_name}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{entry.domain}</div>
              </div>
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
                {entry.rank}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Gesamt', value: entry.overall_score },
                { label: 'ChatGPT', value: entry.platform_scores.chatgpt },
                { label: 'Claude', value: entry.platform_scores.claude },
                { label: 'Gemini', value: entry.platform_scores.gemini },
              ].map(({ label, value }) => (
                <div key={label} className="text-center py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">{label}</div>
                  <div className={`font-bold text-sm ${getScoreColor(value)}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedEntries.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Keine Unternehmen gefunden. Versuchen Sie einen anderen Suchbegriff.
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/RankingTable.tsx
git commit -m "feat: redesign RankingTable — clean borders, light/dark, teal accents"
```

---

## Task 11: Redesign Homepage

**Files:**
- Modify: `frontend/src/app/page.tsx`

**Step 1: Rewrite Homepage**

Complete rewrite with 2-column hero (ranking preview), feature cards, stats, CTA — all in the new "Stripe-Warm" style. No glassmorphism, no cyan, proper light/dark support.

```tsx
import Link from 'next/link';

function HeroRankingPreview() {
  const mockEntries = [
    { rank: 1, name: 'CrowdStrike', score: 87.2 },
    { rank: 2, name: 'Palo Alto Networks', score: 81.5 },
    { rank: 3, name: 'Fortinet', score: 74.3 },
    { rank: 4, name: 'SentinelOne', score: 68.1 },
  ];

  return (
    <div className="relative">
      {/* Teal glow behind card */}
      <div className="absolute -inset-4 bg-teal-400/20 dark:bg-teal-400/10 rounded-3xl blur-3xl" />

      <div className="relative bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl shadow-xl rotate-1 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">Cybersecurity Ranking</div>
          <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">Live</div>
        </div>

        <div className="space-y-3">
          {mockEntries.map((entry) => {
            const barColor = entry.score >= 70 ? 'bg-emerald-500' : 'bg-yellow-500';
            const textColor = entry.score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400';
            return (
              <div key={entry.rank} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                  {entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.name}</div>
                  <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${entry.score}%` }} />
                  </div>
                </div>
                <div className={`text-sm font-semibold tabular-nums ${textColor}`}>{entry.score}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-4 text-xs text-gray-400">
          <span>ChatGPT</span>
          <span>Claude</span>
          <span>Gemini</span>
          <span>Perplexity</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide uppercase mb-4">
                KI-Sichtbarkeit messen
              </div>
              <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-white leading-tight mb-6">
                Wie sichtbar ist Ihr Unternehmen in KI-Chatbots?
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg leading-relaxed">
                Messen Sie Ihre GEO-Performance in ChatGPT, Claude, Gemini und Perplexity.
                Entdecken Sie ungenutztes Potenzial und ueberholen Sie Ihre Wettbewerber.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/ranking/cybersecurity"
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all text-center"
                >
                  Rankings ansehen
                </Link>
                <a
                  href="#contact"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center flex items-center justify-center gap-2"
                >
                  Kostenlose Analyse
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>
              <p className="mt-6 text-sm text-gray-400">500+ Unternehmen analysiert</p>
            </div>

            {/* Right: Ranking Preview */}
            <div className="hidden lg:block">
              <HeroRankingPreview />
            </div>
          </div>
        </div>
      </section>

      {/* What is GEO Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide uppercase mb-3">
              Warum GEO?
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white mb-6">
              Was ist Generative Engine Optimization?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Waehrend SEO fuer Google optimiert, fokussiert sich GEO auf KI-gestuetzte Antwortmaschinen
              wie ChatGPT, Claude, Gemini und Perplexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Messbare Ergebnisse',
                description: 'Objektive Scores ueber 4 fuehrende KI-Plattformen. Vergleichen Sie sich mit Wettbewerbern.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Konkrete Empfehlungen',
                description: 'Keine vagen Tipps. Wir zeigen Ihnen exakt, wo Sie ansetzen muessen.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Zukunftssicher',
                description: '40% aller Suchanfragen werden bereits ueber KI-Chatbots gestellt. Trend steigend.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-[#1a1d27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { value: '500+', label: 'Unternehmen analysiert' },
              { value: '4', label: 'KI-Plattformen' },
              { value: '50+', label: 'Queries pro Analyse' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-semibold text-teal-600 dark:text-teal-400 mb-2">{stat.value}</div>
                <div className="text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 border-t border-gray-200 dark:border-[#2e3039]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white mb-6">
            Bereit fuer mehr Sichtbarkeit?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Lassen Sie uns Ihre KI-Praesenz analysieren und massgeschneiderte Strategien entwickeln.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/ranking/cybersecurity"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
            >
              Ranking ansehen
            </Link>
            <a
              href="mailto:info@geo-intelligence.de"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Kontakt aufnehmen
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat: redesign Homepage — 2-col hero, ranking preview, clean Stripe-Warm style"
```

---

## Task 12: Redesign RankingPageClient

**Files:**
- Modify: `frontend/src/app/ranking/[industry]/RankingPageClient.tsx`

**Step 1: Rewrite RankingPageClient — clean hero, breadcrumb, no ambient gradients**

Key changes:
- Remove all ambient background blobs (`blur-3xl` divs)
- Remove gradient top-line
- Clean breadcrumb, meta badges, simple hero
- Teal accents, proper light/dark
- Lead form in a bordered card
- Methodology as collapsible `<details>` element

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { RankingResponse } from '@/lib/api';
import RankingList from '@/components/RankingList';
import LeadForm from '@/components/LeadForm';
import { formatDate } from '@/lib/utils';

type RankingPageClientProps = {
  industry: string;
  initialRanking: RankingResponse | null;
  initialError: string | null;
};

export default function RankingPageClient({ industry, initialRanking, initialError }: RankingPageClientProps) {
  const ranking = initialRanking;
  const error = initialError;

  const [leadPrefill, setLeadPrefill] = useState<{ company_name?: string; message?: string } | undefined>(undefined);
  const [leadFormNonce, setLeadFormNonce] = useState(0);

  const scrollToLeadForm = () => {
    const el = document.getElementById('lead-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRequestScan = (entry?: { company_name: string; domain: string }) => {
    if (entry) {
      setLeadPrefill({
        company_name: entry.company_name,
        message: `Bitte einen KI-Sichtbarkeits-Scan fuer ${entry.company_name} (${entry.domain}) erstellen.`,
      });
      setLeadFormNonce((n) => n + 1);
    } else {
      setLeadPrefill(undefined);
    }
    scrollToLeadForm();
  };

  const year = new Date().getFullYear();
  const lastUpdated = ranking?.last_updated ? formatDate(ranking.last_updated) : '–';
  const rawIndustryName = ranking?.industry_name ?? 'Ranking';
  const shortIndustryName = rawIndustryName.includes(':')
    ? rawIndustryName.split(':').slice(1).join(':').trim()
    : rawIndustryName;

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            Startseite
          </Link>
          <svg className="w-4 h-4 mx-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 dark:text-white font-medium">{shortIndustryName}</span>
        </div>

        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-white mb-4">
            {shortIndustryName} Ranking {year}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
            Die besten Anbieter im DACH-Raum basierend auf ihrer Sichtbarkeit in KI-Assistenten.
          </p>

          {ranking && (
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1 text-sm">
                {ranking.total_companies} Unternehmen
              </span>
              <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1 text-sm">
                Aktualisiert: {lastUpdated}
              </span>
              <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1 text-sm">
                4 Plattformen
              </span>
            </div>
          )}
        </div>

        {/* Ranking */}
        {ranking ? (
          <div className="mb-16">
            <RankingList
              entries={ranking.entries}
              onRequestScan={(entry) => {
                if (!entry) return handleRequestScan();
                return handleRequestScan({ company_name: entry.company_name, domain: entry.domain });
              }}
            />
          </div>
        ) : (
          <div className="mb-16">
            <div className="max-w-xl mx-auto rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ranking konnte nicht geladen werden</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{error || 'Daten konnten nicht geladen werden.'}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
              >
                Neu laden
              </button>
            </div>
          </div>
        )}

        {/* Lead Form */}
        <div
          id="lead-form"
          className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl p-8 lg:p-12 shadow-sm scroll-mt-24"
        >
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-3">
              Ihr Unternehmen fehlt im Ranking?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fordern Sie einen kostenlosen KI-Sichtbarkeits-Check an und erhalten Sie einen Report mit konkreten Empfehlungen.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <LeadForm
              key={`lead-form-${leadFormNonce}`}
              industryId={ranking?.industry_id}
              sourcePage={`/ranking/${industry}`}
              prefill={leadPrefill}
            />
          </div>
        </div>

        {/* Methodology */}
        <details className="mt-12 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl">
          <summary className="px-6 py-4 cursor-pointer flex items-center gap-3 text-gray-900 dark:text-white font-medium">
            <svg className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Wie wird der Score berechnet?
          </summary>
          <div className="px-6 pb-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Wir stellen KI-Plattformen ein Set branchenrelevanter Fragen und messen, wie oft und in welcher Position Ihr Unternehmen genannt wird.
              Der Gesamt-Score ist eine Aggregation der Plattform-Scores.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/ranking/[industry]/RankingPageClient.tsx
git commit -m "feat: redesign RankingPage — clean hero, breadcrumbs, no ambient gradients"
```

---

## Task 13: Redesign ReportPageClient

**Files:**
- Modify: `frontend/src/app/report/[id]/ReportPageClient.tsx`

**Step 1: Rewrite ReportPageClient — all sections in new style**

Key changes:
- Breadcrumb navigation
- Clean card for overall score with ScoreCircle
- Platform bars in a bordered card
- Strengths/weaknesses/opportunities with colored headers
- Competitors table with alternating rows
- Recommendation cards (already restyled)
- Lead form in bordered card
- All text: teal instead of cyan, proper light/dark

```tsx
'use client';

import Link from 'next/link';
import type { ReportResponse } from '@/lib/api';
import ScoreCircle from '@/components/ScoreCircle';
import PlatformBar from '@/components/PlatformBar';
import RecommendationCard from '@/components/RecommendationCard';
import LeadForm from '@/components/LeadForm';

type ReportPageClientProps = {
  scanId: string;
  initialReport: ReportResponse | null;
  initialError: string | null;
};

export default function ReportPageClient({ scanId, initialReport, initialError }: ReportPageClientProps) {
  if (!initialReport) {
    return (
      <div className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurueck zur Startseite
            </Link>
          </div>

          <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Report konnte nicht geladen werden</h2>
            <p className="text-gray-600 dark:text-gray-300">{initialError || 'Fehler beim Laden des Reports'}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              Neu laden
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { company, scan, recommendations } = initialReport;
  const analysis = scan.analysis || { strengths: [], weaknesses: [], opportunities: [] };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Startseite</Link>
          <svg className="w-4 h-4 mx-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 dark:text-white font-medium">{company.name}</span>
        </div>

        {/* Hero */}
        <div className="mb-16">
          <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide uppercase mb-3">
            GEO Intelligence Report
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white mb-3">
            {company.name}
          </h1>
          <a
            href={`https://${company.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            {company.domain} ↗
          </a>
          {company.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-3xl text-lg">{company.description}</p>
          )}
        </div>

        {/* Overall Score */}
        <div className="mb-16 flex justify-center">
          <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl p-8 shadow-sm">
            <ScoreCircle score={scan.overall_score} size={220} label="Gesamt-Score" />
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Performance nach Plattform
          </h2>
          <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6 shadow-sm">
            <div className="space-y-5">
              <PlatformBar platform="chatgpt" score={scan.platform_scores.chatgpt} />
              <PlatformBar platform="claude" score={scan.platform_scores.claude} />
              <PlatformBar platform="gemini" score={scan.platform_scores.gemini} />
              <PlatformBar platform="perplexity" score={scan.platform_scores.perplexity} />
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Detaillierte Analyse
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Staerken</h3>
                  </div>
                </div>
                <ul className="p-6 space-y-3">
                  {analysis.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">&#10003;</span>
                      <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.weaknesses && analysis.weaknesses.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-200 dark:border-rose-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold text-rose-800 dark:text-rose-300">Schwaechen</h3>
                  </div>
                </div>
                <ul className="p-6 space-y-3">
                  {analysis.weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-rose-500 mt-0.5 flex-shrink-0">&#10007;</span>
                      <span className="text-gray-700 dark:text-gray-300">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.opportunities && analysis.opportunities.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">Chancen</h3>
                  </div>
                </div>
                <ul className="p-6 space-y-3">
                  {analysis.opportunities.map((opportunity, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">&#8594;</span>
                      <span className="text-gray-700 dark:text-gray-300">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Competitors */}
        {scan.competitors && scan.competitors.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Top Wettbewerber
            </h2>
            <div className="max-w-2xl bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2e3039]">
                    <th className="text-left py-3 px-5 text-sm font-medium text-gray-500 dark:text-gray-400">Unternehmen</th>
                    <th className="text-right py-3 px-5 text-sm font-medium text-gray-500 dark:text-gray-400">Nennungen</th>
                  </tr>
                </thead>
                <tbody>
                  {scan.competitors.slice(0, 10).map((competitor, index) => (
                    <tr key={index} className="border-t border-gray-100 dark:border-[#2e3039] even:bg-gray-50 dark:even:bg-white/[0.02]">
                      <td className="py-3 px-5 text-gray-900 dark:text-white text-sm">{competitor.name}</td>
                      <td className="py-3 px-5 text-right">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-semibold text-sm">
                          {competitor.mentions}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Handlungsempfehlungen
            </h2>
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard key={index} index={index + 1} text={recommendation} />
              ))}
            </div>
          </div>
        )}

        {/* CTA / Lead Form */}
        <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl p-8 lg:p-12 shadow-sm">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-3">
              KI-Sichtbarkeit verbessern?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Unsere GEO-Experten entwickeln mit Ihnen eine massgeschneiderte Strategie.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <LeadForm sourcePage={`/report/${scanId}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/report/[id]/ReportPageClient.tsx
git commit -m "feat: redesign ReportPage — clean cards, colored analysis headers, no glassmorphism"
```

---

## Task 14: Visual QA & Final Polish

**Step 1: Start dev server and check all pages**

Run: `cd frontend && npm run dev`

Check:
- Homepage loads in light mode
- Dark mode toggle works
- `/ranking/cybersecurity` loads correctly
- Report pages load (if backend is running)
- No Tailwind class errors in console
- Responsive at mobile, tablet, desktop breakpoints

**Step 2: Fix any visual issues found during QA**

Common things to check:
- Fonts rendering as Inter (not Space Grotesk)
- No leftover cyan colors (should all be teal)
- No glassmorphism artifacts (`bg-white/5`, `backdrop-blur` on content)
- Dark mode toggle persists across navigation
- Score colors display correctly in both modes
- Cards have visible borders in light mode

**Step 3: Run build to check for errors**

Run: `cd frontend && npm run build`
Expected: Builds successfully with no type errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: visual QA fixes for design overhaul"
```
