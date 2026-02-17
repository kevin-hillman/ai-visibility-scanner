// Score color utilities — work in both light and dark mode
export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-50 dark:bg-emerald-500/20';
  if (score >= 40) return 'bg-yellow-50 dark:bg-yellow-500/20';
  return 'bg-rose-50 dark:bg-rose-500/20';
}

export function getScoreBorderColor(score: number): string {
  if (score >= 70) return 'border-emerald-200 dark:border-emerald-500/40';
  if (score >= 40) return 'border-yellow-200 dark:border-yellow-500/40';
  return 'border-rose-200 dark:border-rose-500/40';
}

export function getScoreGradient(score: number): string {
  if (score >= 70) return 'from-emerald-500 to-emerald-600';
  if (score >= 40) return 'from-yellow-500 to-yellow-600';
  return 'from-rose-500 to-rose-600';
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Gut';
  if (score >= 40) return 'Mittel';
  return 'Schwach';
}

// Rank badge colors
export function getRankBadgeColor(rank: number): string {
  if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/40';
  if (rank === 2) return 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500/40';
  if (rank === 3) return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
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

// Platform colors — solid colors, no gradients
export const platformColors: Record<string, string> = {
  chatgpt: 'bg-emerald-500',
  claude: 'bg-orange-500',
  gemini: 'bg-blue-500',
  perplexity: 'bg-violet-500',
};

// Platform text colors for labels
export const platformTextColors: Record<string, string> = {
  chatgpt: 'text-emerald-600 dark:text-emerald-400',
  claude: 'text-orange-600 dark:text-orange-400',
  gemini: 'text-blue-600 dark:text-blue-400',
  perplexity: 'text-violet-600 dark:text-violet-400',
};
