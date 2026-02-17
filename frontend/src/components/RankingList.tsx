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
        <button type="button" onClick={() => onRequestScan()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 px-5 py-2.5 font-medium text-white transition-colors">
          Mehr erfahren
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function RankingCard({ entry, onRequestScan }: { entry: RankingEntry; onRequestScan: RankingListProps['onRequestScan'] }) {
  const reportHref = entry.scan_id ? `/report/${entry.scan_id}` : null;

  return (
    <div className="group bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl px-4 py-4 sm:px-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`shrink-0 inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-bold tabular-nums text-sm ${getRankBadgeColor(entry.rank)}`}
            aria-label={`Rang ${entry.rank}`}>
            {entry.rank}
          </div>
          <div className="min-w-0">
            {reportHref ? (
              <Link href={reportHref}
                className="block text-base sm:text-lg font-semibold text-gray-900 dark:text-white tracking-tight truncate hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {entry.company_name}
              </Link>
            ) : (
              <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white tracking-tight truncate">
                {entry.company_name}
              </div>
            )}
            <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">{entry.domain}</div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
          <ScoreBlock score={entry.overall_score} />
          {reportHref ? (
            <Link href={reportHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label={`Report oeffnen fuer ${entry.company_name}`}>
              Report
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <button type="button" onClick={() => onRequestScan({ company_name: entry.company_name, domain: entry.domain })}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2.5 font-medium text-white transition-colors"
              aria-label={`Scan anfordern fuer ${entry.company_name}`}>
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
      (entry) => entry.company_name.toLowerCase().includes(term) || entry.domain.toLowerCase().includes(term)
    );
  }, [entries, searchTerm]);

  const shouldShowCta = searchTerm.trim() === '';
  const insertMidCta = shouldShowCta && filteredEntries.length > 4;

  return (
    <div className="space-y-3">
      <div className="relative">
        <input type="text" placeholder="Unternehmen oder Domain suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors" />
        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <li className="animate-fadeIn" style={{ animationDelay: `${Math.min(index, 10) * 60}ms`, animationFillMode: 'both' }}>
              <RankingCard entry={entry} onRequestScan={onRequestScan} />
            </li>
          </Fragment>
        ))}
      </ol>

      {shouldShowCta && filteredEntries.length <= 4 && <MidPageCtaCard onRequestScan={onRequestScan} />}

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Keine Unternehmen gefunden. Versuchen Sie einen anderen Suchbegriff.
        </div>
      )}
    </div>
  );
}
