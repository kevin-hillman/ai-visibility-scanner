'use client';

import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import type { RankingEntry } from '@/lib/api';
import {
  getRankBadgeColor,
  getScoreBgColor,
  getScoreBorderColor,
  getScoreColor,
  platformNames,
} from '@/lib/utils';

const PLATFORMS = ['chatgpt', 'claude', 'gemini', 'perplexity'] as const;

type RankingListProps = {
  entries: RankingEntry[];
  onRequestScan: (entry?: Pick<RankingEntry, 'company_name' | 'domain'>) => void;
};

function ScorePill({ score }: { score: number }) {
  return (
    <span
      className={[
        'inline-flex items-center justify-center',
        'w-16 h-9 rounded-xl font-bold',
        getScoreBgColor(score),
        getScoreColor(score),
        'border',
        getScoreBorderColor(score),
      ].join(' ')}
    >
      {score}
    </span>
  );
}

function PlatformChips({ entry }: { entry: RankingEntry }) {
  return (
    <div className="hidden lg:flex flex-wrap gap-2 mt-3">
      {PLATFORMS.map((platform) => (
        <div
          key={platform}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1"
        >
          <span className="text-[11px] text-gray-400">{platformNames[platform]}</span>
          <span className={['text-[11px] font-semibold', getScoreColor(entry.platform_scores[platform])].join(' ')}>
            {entry.platform_scores[platform]}
          </span>
        </div>
      ))}
    </div>
  );
}

function MidPageCtaCard({ onRequestScan }: { onRequestScan: RankingListProps['onRequestScan'] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-white/5 to-white/5 p-6 sm:p-8">
      <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-2xl" />
      <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-white/5 blur-2xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-200 uppercase tracking-wider">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          Manage & Retain
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Starte dein eigenes KI-Tracking fuer Kunden
            </h3>
            <p className="mt-2 text-gray-300">
              Multi-Client Dashboard mit regelmaessigen Updates, Reports und konkreten Handlungsempfehlungen.
            </p>
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

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-300">
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
            <span className="text-cyan-300 font-semibold">Multi-Client</span> Setup
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
            <span className="text-cyan-300 font-semibold">Updates</span> regelmaessig
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
            <span className="text-cyan-300 font-semibold">Report</span> inkl. Empfehlungen
          </div>
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
        'group rounded-2xl border border-white/10 bg-white/5 p-5',
        'hover:bg-white/10 hover:border-white/20 transition-colors',
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <span
            className={[
              'shrink-0 inline-flex items-center justify-center',
              'w-12 h-12 rounded-xl font-bold',
              getRankBadgeColor(entry.rank),
            ].join(' ')}
            aria-label={`Rang ${entry.rank}`}
          >
            #{entry.rank}
          </span>

          <div className="min-w-0">
            {reportHref ? (
              <Link
                href={reportHref}
                className="block text-lg sm:text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors truncate"
              >
                {entry.company_name}
              </Link>
            ) : (
              <div className="text-lg sm:text-xl font-semibold text-white truncate">
                {entry.company_name}
              </div>
            )}
            <div className="mt-0.5 text-sm text-gray-400 truncate">{entry.domain}</div>

            <PlatformChips entry={entry} />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">Score</div>
              <div className="mt-1">
                <ScorePill score={entry.overall_score} />
              </div>
            </div>
          </div>

          {reportHref ? (
            <Link
              href={reportHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3 font-semibold text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors"
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 font-semibold text-white hover:bg-white/10 hover:border-white/15 transition-colors"
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
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Unternehmen oder Domain suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
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
              <li>
                <MidPageCtaCard onRequestScan={onRequestScan} />
              </li>
            )}
            <li>
              <RankingCard entry={entry} onRequestScan={onRequestScan} />
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
