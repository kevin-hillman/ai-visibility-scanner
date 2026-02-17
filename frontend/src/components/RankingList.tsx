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
  return (
    <div className="text-right leading-none">
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-white">
        {safeScore.toFixed(1)}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">Score</div>
    </div>
  );
}

function MidPageCtaCard({ onRequestScan }: { onRequestScan: RankingListProps['onRequestScan'] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.06] to-white/[0.03] p-5 sm:p-6">
      <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-2xl" />
      <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/25">
            <svg className="h-6 w-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 14l3-3 4 4 7-7" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-gray-200 uppercase tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Manage & Retain
            </div>
            <h3 className="mt-3 text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Starte dein eigenes KI-Tracking fuer Kunden
            </h3>
            <p className="mt-1.5 text-gray-300 text-sm sm:text-base">
              Multi-Client Dashboard mit regelmaessigen Updates, Reports und konkreten Empfehlungen.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRequestScan()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-3 font-semibold text-white hover:from-cyan-600 hover:to-cyan-700 transition-colors"
        >
          Mehr erfahren
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2 text-sm text-gray-300">
        <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
          <span className="text-cyan-200 font-semibold">Multi-Client</span> Setup
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
          <span className="text-cyan-200 font-semibold">Updates</span> regelmaessig
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
          <span className="text-cyan-200 font-semibold">Reports</span> inkl. Empfehlungen
        </div>
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
    <div
      className={[
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur px-4 py-4 sm:px-5',
        'transition-colors duration-200',
        reportHref ? 'hover:bg-white/[0.06] hover:border-white/20' : 'hover:bg-white/[0.05] hover:border-white/15',
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={[
              'shrink-0 inline-flex items-center justify-center',
              'w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-bold tabular-nums',
              getRankBadgeColor(entry.rank),
            ].join(' ')}
            aria-label={`Rang ${entry.rank}`}
          >
            {entry.rank}
          </div>

          <div className="min-w-0">
            {reportHref ? (
              <Link
                href={reportHref}
                className="block text-base sm:text-lg font-semibold text-white tracking-tight truncate hover:text-cyan-200 transition-colors"
              >
                {entry.company_name}
              </Link>
            ) : (
              <div className="text-base sm:text-lg font-semibold text-white tracking-tight truncate">
                {entry.company_name}
              </div>
            )}
            <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-gray-400 min-w-0">
              <span className="truncate">{entry.domain}</span>
              <span className="hidden sm:inline text-gray-600">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-gray-300">
                KI-Sichtbarkeit
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
          <ScoreBlock score={entry.overall_score} />

          {reportHref ? (
            <Link
              href={reportHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 font-semibold text-white hover:bg-white/10 hover:border-white/15 hover:text-cyan-200 transition-colors"
              aria-label={`Report oeffnen fuer ${entry.company_name}`}
            >
              Report oeffnen
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onRequestScan({ company_name: entry.company_name, domain: entry.domain })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3 font-semibold text-white hover:from-cyan-600 hover:to-cyan-700 transition-colors"
              aria-label={`Scan anfordern fuer ${entry.company_name}`}
            >
              Scan anfordern
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
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
  const insertMidCta = shouldShowCta && filteredEntries.length > 3;

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          placeholder="Unternehmen oder Domain suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-black/30 backdrop-blur border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/35 focus:border-cyan-500/30"
        />
        <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <svg
          className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
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
            {insertMidCta && index === 3 && (
              <li
                className="animate-fadeIn"
                style={{ animationDelay: '240ms', animationFillMode: 'both' }}
              >
                <MidPageCtaCard onRequestScan={onRequestScan} />
              </li>
            )}
            <li
              className="animate-fadeIn"
              style={{
                animationDelay: `${Math.min(index, 10) * 60}ms`,
                animationFillMode: 'both',
              }}
            >
              <RankingCard
                entry={entry}
                onRequestScan={onRequestScan}
              />
            </li>
          </Fragment>
        ))}
      </ol>

      {shouldShowCta && filteredEntries.length <= 3 && (
        <MidPageCtaCard onRequestScan={onRequestScan} />
      )}

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Keine Unternehmen gefunden. Versuchen Sie einen anderen Suchbegriff.
        </div>
      )}
    </div>
  );
}
