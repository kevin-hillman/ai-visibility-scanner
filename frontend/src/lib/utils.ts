// Score color utilities
export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-rose-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500/20';
  if (score >= 40) return 'bg-yellow-500/20';
  return 'bg-rose-500/20';
}

export function getScoreBorderColor(score: number): string {
  if (score >= 70) return 'border-emerald-500/40';
  if (score >= 40) return 'border-yellow-500/40';
  return 'border-rose-500/40';
}

export function getScoreGradient(score: number): string {
  if (score >= 70) return 'from-emerald-500 to-emerald-600';
  if (score >= 40) return 'from-yellow-500 to-yellow-600';
  return 'from-rose-500 to-rose-600';
}

// Rank badge colors
export function getRankBadgeColor(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900';
  if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900';
  if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
  return 'bg-white/10 text-gray-300';
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

// Platform colors
export const platformColors: Record<string, string> = {
  chatgpt: 'from-green-500 to-green-600',
  claude: 'from-orange-500 to-orange-600',
  gemini: 'from-blue-500 to-blue-600',
  perplexity: 'from-purple-500 to-purple-600',
};
