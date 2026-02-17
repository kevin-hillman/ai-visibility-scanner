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
      setLeadPrefill({ company_name: entry.company_name, message: `Bitte einen KI-Sichtbarkeits-Scan für ${entry.company_name} (${entry.domain}) erstellen.` });
      setLeadFormNonce((n) => n + 1);
    } else {
      setLeadPrefill(undefined);
    }
    scrollToLeadForm();
  };

  const year = new Date().getFullYear();
  const lastUpdated = ranking?.last_updated ? formatDate(ranking.last_updated) : '–';
  const rawIndustryName = ranking?.industry_name ?? 'Ranking';
  const shortIndustryName = rawIndustryName.includes(':') ? rawIndustryName.split(':').slice(1).join(':').trim() : rawIndustryName;

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Startseite</Link>
          <svg className="w-4 h-4 mx-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 dark:text-white font-medium">{shortIndustryName}</span>
        </div>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-white mb-4">{shortIndustryName} Ranking {year}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">Die besten Anbieter im DACH-Raum basierend auf ihrer Sichtbarkeit in KI-Assistenten.</p>
          {ranking && (
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1 text-sm">{ranking.total_companies} Unternehmen</span>
              <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1 text-sm">Aktualisiert: {lastUpdated}</span>
              <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1 text-sm">4 Plattformen</span>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 max-w-2xl leading-relaxed">
            Basierend auf automatisierten Analysen über ChatGPT, Claude, Gemini und Perplexity.
            Jedes Unternehmen wird mit branchenspezifischen Fragen getestet und nach KI-Sichtbarkeit bewertet.
          </p>
        </div>

        {ranking ? (
          <div className="mb-16">
            <RankingList entries={ranking.entries} onRequestScan={(entry) => { if (!entry) return handleRequestScan(); return handleRequestScan({ company_name: entry.company_name, domain: entry.domain }); }} />
          </div>
        ) : (
          <div className="mb-16">
            <div className="max-w-xl mx-auto rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ranking konnte nicht geladen werden</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{error || 'Daten konnten nicht geladen werden.'}</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">Neu laden</button>
            </div>
          </div>
        )}

        <div id="lead-form" className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl p-8 lg:p-12 shadow-sm scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-3">Ihr Unternehmen fehlt im Ranking?</h2>
            <p className="text-gray-600 dark:text-gray-400">Fordern Sie einen kostenlosen KI-Sichtbarkeits-Check an und erhalten Sie einen Report mit konkreten Empfehlungen.</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <LeadForm key={`lead-form-${leadFormNonce}`} industryId={ranking?.industry_id} sourcePage={`/ranking/${industry}`} prefill={leadPrefill} />
          </div>
        </div>

        <details className="mt-12 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl">
          <summary className="px-6 py-4 cursor-pointer flex items-center gap-3 text-gray-900 dark:text-white font-medium">
            <svg className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Wie wird der Score berechnet?
          </summary>
          <div className="px-6 pb-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Wir stellen KI-Plattformen ein Set branchenrelevanter Fragen und messen, wie oft und in welcher Position Ihr Unternehmen genannt wird. Der Gesamt-Score ist eine Aggregation der Plattform-Scores.</p>
          </div>
        </details>
      </div>
    </div>
  );
}
