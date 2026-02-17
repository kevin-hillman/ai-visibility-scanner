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

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === 'positive') return <span className="text-emerald-500 text-xs" title="Positiv">&#9650;</span>;
  if (sentiment === 'negative') return <span className="text-rose-500 text-xs" title="Negativ">&#9660;</span>;
  return <span className="text-gray-400 text-xs" title="Neutral">&#9679;</span>;
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

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Analysierte Suchanfragen</h2>
        <InfoTooltip text="Diese Fragen wurden an die KI-Plattformen gestellt, um zu messen, ob und wie Ihr Unternehmen empfohlen wird." />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'chatgpt', 'claude', 'gemini', 'perplexity'] as FilterPlatform[]).map((p) => (
          <button key={p} type="button" onClick={() => setPlatformFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              platformFilter === p
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {p === 'all' ? 'Alle Plattformen' : platformNames[p]}
          </button>
        ))}
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1 self-stretch" />
        {(['all', 'yes', 'no'] as FilterMentioned[]).map((m) => (
          <button key={m} type="button" onClick={() => setMentionFilter(m)}
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
                <div className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${anyMentioned ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">&ldquo;{queryText}&rdquo;</p>
                  <div className="flex items-center gap-2 mt-2">
                    {results.map((r, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <PlatformDot platform={r.platform} />
                        {r.mentioned && <SentimentIcon sentiment={r.sentiment} />}
                      </span>
                    ))}
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {results.map((r, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-4 text-sm">
                      <PlatformDot platform={r.platform} />
                      <span className="text-gray-600 dark:text-gray-300 w-20 shrink-0">{platformNames[r.platform]}</span>
                      <span className={`font-medium shrink-0 ${r.mentioned ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                        {r.mentioned ? `Pos. ${r.position ?? '\u2013'}` : 'Nicht erwähnt'}
                      </span>
                      {r.mentioned && <SentimentIcon sentiment={r.sentiment} />}
                      {r.context && r.mentioned && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">
                          {r.context.length > 120 ? r.context.slice(0, 120) + '\u2026' : r.context}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {grouped.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          Keine Ergebnisse für die gewählten Filter.
        </div>
      )}
    </div>
  );
}
