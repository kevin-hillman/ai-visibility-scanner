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
    let filtered = entries.filter(
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Unternehmen oder Domain suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
        <svg
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-4">
                <button
                  onClick={() => handleSort('rank')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <span>Rang</span>
                  <SortIcon field="rank" />
                </button>
              </th>
              <th className="text-left py-4 px-4">
                <button
                  onClick={() => handleSort('company_name')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <span>Unternehmen</span>
                  <SortIcon field="company_name" />
                </button>
              </th>
              <th className="text-left py-4 px-4">
                <span className="text-gray-400">Domain</span>
              </th>
              <th className="text-center py-4 px-4">
                <button
                  onClick={() => handleSort('overall_score')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mx-auto"
                >
                  <span>Gesamt</span>
                  <SortIcon field="overall_score" />
                </button>
              </th>
              <th className="text-center py-4 px-4">
                <button
                  onClick={() => handleSort('chatgpt')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mx-auto"
                >
                  <span>ChatGPT</span>
                  <SortIcon field="chatgpt" />
                </button>
              </th>
              <th className="text-center py-4 px-4">
                <button
                  onClick={() => handleSort('claude')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mx-auto"
                >
                  <span>Claude</span>
                  <SortIcon field="claude" />
                </button>
              </th>
              <th className="text-center py-4 px-4">
                <button
                  onClick={() => handleSort('gemini')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mx-auto"
                >
                  <span>Gemini</span>
                  <SortIcon field="gemini" />
                </button>
              </th>
              <th className="text-center py-4 px-4">
                <button
                  onClick={() => handleSort('perplexity')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mx-auto"
                >
                  <span>Perplexity</span>
                  <SortIcon field="perplexity" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEntries.map((entry) => (
              <tr
                key={`${entry.domain}-${entry.rank}`}
                onClick={() => onRowClick(entry)}
                className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold ${getRankBadgeColor(entry.rank)}`}>
                    #{entry.rank}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                    {entry.company_name}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-gray-400 text-sm">{entry.domain}</div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-flex items-center justify-center w-16 h-8 rounded-lg font-bold ${getScoreBgColor(entry.overall_score)} ${getScoreColor(entry.overall_score)} border ${getScoreBorderColor(entry.overall_score)}`}>
                    {entry.overall_score}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`${getScoreColor(entry.platform_scores.chatgpt)} font-semibold`}>
                    {entry.platform_scores.chatgpt}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`${getScoreColor(entry.platform_scores.claude)} font-semibold`}>
                    {entry.platform_scores.claude}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`${getScoreColor(entry.platform_scores.gemini)} font-semibold`}>
                    {entry.platform_scores.gemini}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`${getScoreColor(entry.platform_scores.perplexity)} font-semibold`}>
                    {entry.platform_scores.perplexity}
                  </span>
                </td>
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
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="font-medium text-white text-lg">{entry.company_name}</div>
                <div className="text-gray-400 text-sm mt-1">{entry.domain}</div>
              </div>
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
                #{entry.rank}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center py-2 bg-white/5 rounded">
                <div className="text-gray-400 text-xs mb-1">Gesamt</div>
                <div className={`font-bold ${getScoreColor(entry.overall_score)}`}>
                  {entry.overall_score}
                </div>
              </div>
              <div className="text-center py-2 bg-white/5 rounded">
                <div className="text-gray-400 text-xs mb-1">ChatGPT</div>
                <div className={`font-bold ${getScoreColor(entry.platform_scores.chatgpt)}`}>
                  {entry.platform_scores.chatgpt}
                </div>
              </div>
              <div className="text-center py-2 bg-white/5 rounded">
                <div className="text-gray-400 text-xs mb-1">Claude</div>
                <div className={`font-bold ${getScoreColor(entry.platform_scores.claude)}`}>
                  {entry.platform_scores.claude}
                </div>
              </div>
              <div className="text-center py-2 bg-white/5 rounded">
                <div className="text-gray-400 text-xs mb-1">Gemini</div>
                <div className={`font-bold ${getScoreColor(entry.platform_scores.gemini)}`}>
                  {entry.platform_scores.gemini}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedEntries.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Keine Unternehmen gefunden. Versuchen Sie einen anderen Suchbegriff.
        </div>
      )}
    </div>
  );
}
