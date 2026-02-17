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
      // Remount to apply prefill without setState-in-effect patterns.
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
    <div className="relative py-12">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-56 left-1/2 h-96 w-[56rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -top-28 right-[-12rem] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[-12rem] h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <Link href="/" className="inline-flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurueck zur Startseite
            </Link>
            <div className="hidden sm:block">
              Letzte Aktualisierung: <span className="text-gray-300">{lastUpdated}</span>
            </div>
          </div>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/10 px-4 py-2 text-[11px] text-gray-200 uppercase tracking-[0.24em]">
            <svg className="h-4 w-4 text-cyan-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9.049 2.927a1 1 0 011.902 0l1.286 3.957a1 1 0 00.95.69h4.158a1 1 0 01.592 1.806l-3.364 2.444a1 1 0 00-.364 1.118l1.286 3.957a1 1 0 01-1.538 1.118l-3.364-2.444a1 1 0 00-1.176 0l-3.364 2.444a1 1 0 01-1.538-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.065 9.38a1 1 0 01.592-1.806h4.158a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
            Offizielles Ranking {year}
          </div>

          <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight">
            <span className="text-white">{shortIndustryName}</span>
            <span className="text-cyan-200"> Ranking {year}</span>
          </h1>

          <p className="mt-4 text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Die besten Anbieter im DACH-Raum basierend auf ihrer Sichtbarkeit in KI-Assistenten.
          </p>

          {ranking && (
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-400">
              <div className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                <span>
                  <span className="text-gray-200 font-semibold">{ranking.total_companies}</span> Unternehmen analysiert
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                <span>Letzte Aktualisierung: <span className="text-gray-200">{lastUpdated}</span></span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                <span>Plattformen: ChatGPT, Claude, Gemini, Perplexity</span>
              </div>
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
            <div className="max-w-xl mx-auto rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
              <div className="text-rose-300 text-4xl">!</div>
              <h2 className="mt-3 text-xl font-bold text-white">Ranking konnte nicht geladen werden</h2>
              <p className="mt-2 text-gray-300 text-sm">{error || 'Daten konnten nicht geladen werden.'}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/10 px-4 py-2 font-semibold text-white hover:bg-white/15 transition-colors"
              >
                Neu laden
              </button>
            </div>
          </div>
        )}

        {/* Lead Form */}
        <div
          id="lead-form"
          className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl p-8 lg:p-12 scroll-mt-24"
        >
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ihr Unternehmen fehlt im Ranking?
            </h2>
            <p className="text-lg text-gray-300">
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

        {/* Method note */}
        <div className="mt-12 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Wie wird der Score berechnet?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Wir stellen KI-Plattformen ein Set branchenrelevanter Fragen und messen, wie oft und in welcher Position Ihr Unternehmen genannt wird.
                Der Gesamt-Score ist eine Aggregation der Plattform-Scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
