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
      (entry) => entry.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || entry.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      if (sortField === 'company_name') { aValue = a.company_name.toLowerCase(); bValue = b.company_name.toLowerCase(); }
      else if (sortField === 'rank' || sortField === 'overall_score') { aValue = a[sortField]; bValue = b[sortField]; }
      else { aValue = a.platform_scores[sortField]; bValue = b.platform_scores[sortField]; }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [entries, searchTerm, sortField, sortOrder]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input type="text" placeholder="Unternehmen oder Domain suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
        <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="hidden lg:block overflow-x-auto bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#2e3039]">
              {(['rank', 'company_name'] as SortField[]).map((field) => (
                <th key={field} className="text-left py-4 px-4">
                  <button onClick={() => handleSort(field)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
                    <span>{field === 'rank' ? 'Rang' : 'Unternehmen'}</span>
                    <SortIcon field={field} sortField={sortField} sortOrder={sortOrder} />
                  </button>
                </th>
              ))}
              <th className="text-left py-4 px-4"><span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Domain</span></th>
              {(['overall_score', 'chatgpt', 'claude', 'gemini', 'perplexity'] as SortField[]).map((field) => (
                <th key={field} className="text-center py-4 px-4">
                  <button onClick={() => handleSort(field)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mx-auto text-sm font-medium">
                    <span>{field === 'overall_score' ? 'Gesamt' : field.charAt(0).toUpperCase() + field.slice(1)}</span>
                    <SortIcon field={field} sortField={sortField} sortOrder={sortOrder} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEntries.map((entry) => (
              <tr key={`${entry.domain}-${entry.rank}`} onClick={() => onRowClick(entry)}
                className="border-b border-gray-100 dark:border-[#2e3039] hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>{entry.rank}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{entry.company_name}</div>
                </td>
                <td className="py-4 px-4"><div className="text-gray-500 dark:text-gray-400 text-sm">{entry.domain}</div></td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-flex items-center justify-center w-16 h-8 rounded-lg font-bold text-sm ${getScoreBgColor(entry.overall_score)} ${getScoreColor(entry.overall_score)} border ${getScoreBorderColor(entry.overall_score)}`}>{entry.overall_score}</span>
                </td>
                {(['chatgpt', 'claude', 'gemini', 'perplexity'] as const).map((platform) => (
                  <td key={platform} className="py-4 px-4 text-center">
                    <span className={`${getScoreColor(entry.platform_scores[platform])} font-semibold text-sm`}>{entry.platform_scores[platform]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-3">
        {filteredAndSortedEntries.map((entry) => (
          <div key={`${entry.domain}-${entry.rank}`} onClick={() => onRowClick(entry)}
            className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white text-lg">{entry.company_name}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{entry.domain}</div>
              </div>
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>{entry.rank}</span>
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
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Keine Unternehmen gefunden. Versuchen Sie einen anderen Suchbegriff.</div>
      )}
    </div>
  );
}
