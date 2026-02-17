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
        'h-10 min-w-16 px-3 rounded-xl font-bold text-lg tabular-nums',
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
    <div className="flex flex-wrap gap-2">
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
  showPlatformBreakdown,
}: {
  entry: RankingEntry;
  onRequestScan: RankingListProps['onRequestScan'];
  showPlatformBreakdown: boolean;
}) {
  const reportHref = entry.scan_id ? `/report/${entry.scan_id}` : null;

  return (
    <div
      className={[
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5',
        'transition-all duration-200',
        reportHref ? 'cursor-pointer hover:bg-white/[0.07] hover:border-white/20' : 'hover:bg-white/[0.06] hover:border-white/15',
        'focus-within:ring-2 focus-within:ring-cyan-500/30',
      ].join(' ')}
      onClick={
        reportHref
          ? undefined
          : () => onRequestScan({ company_name: entry.company_name, domain: entry.domain })
      }
      role={reportHref ? undefined : 'button'}
      tabIndex={reportHref ? undefined : 0}
      onKeyDown={
        reportHref
          ? undefined
          : (e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              onRequestScan({ company_name: entry.company_name, domain: entry.domain });
            }
      }
      aria-label={
        reportHref
          ? undefined
          : `Scan anfordern fuer ${entry.company_name}`
      }
    >
      {reportHref && (
        <Link
          href={reportHref}
          aria-label={`Report oeffnen fuer ${entry.company_name}`}
          className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
        >
          <span className="sr-only">Report oeffnen</span>
        </Link>
      )}

      {/* Subtle hover glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute -inset-x-24 -inset-y-16 bg-gradient-to-r from-cyan-500/0 via-cyan-500/15 to-indigo-500/0 blur-2xl" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <span
            className={[
              'shrink-0 inline-flex items-center justify-center',
              'w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-bold tabular-nums',
              getRankBadgeColor(entry.rank),
            ].join(' ')}
            aria-label={`Rang ${entry.rank}`}
          >
            #{entry.rank}
          </span>

          <div className="min-w-0">
            <div className="text-base sm:text-lg font-semibold text-white tracking-tight truncate">
              {entry.company_name}
            </div>
            <div className="mt-0.5 text-xs sm:text-sm text-gray-400 truncate">
              {entry.domain}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase tracking-[0.18em]">Score</div>
            <div className="mt-1">
              <ScorePill score={entry.overall_score} />
            </div>
          </div>

          {reportHref ? (
            <span
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3 font-semibold text-cyan-200 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 transition-colors"
              aria-hidden="true"
            >
              Report oeffnen
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestScan({ company_name: entry.company_name, domain: entry.domain });
              }}
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

      {showPlatformBreakdown && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-gray-500 uppercase tracking-[0.18em]">
              Plattform-Scores
            </div>
            <div className="text-xs text-gray-400">
              (einzeln, ohne Details)
            </div>
          </div>
          <div className="mt-3">
            <PlatformChips entry={entry} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function RankingList({ entries, onRequestScan }: RankingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlatformBreakdown, setShowPlatformBreakdown] = useState(false);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Unternehmen oder Domain suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-black/30 backdrop-blur border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/30"
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

        <button
          type="button"
          onClick={() => setShowPlatformBreakdown((v) => !v)}
          className="inline-flex items-center justify-between gap-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/15 transition-colors"
          aria-pressed={showPlatformBreakdown}
        >
          <span className="text-gray-200">Plattform-Details</span>
          <span
            className={[
              'relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors',
              showPlatformBreakdown ? 'bg-cyan-500/20 border-cyan-500/40' : 'bg-white/5 border-white/10',
            ].join(' ')}
            aria-hidden="true"
          >
            <span
              className={[
                'absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white/80 transition-transform',
                showPlatformBreakdown ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          </span>
        </button>
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
                showPlatformBreakdown={showPlatformBreakdown}
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
