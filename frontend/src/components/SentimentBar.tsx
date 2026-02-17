import InfoTooltip from './InfoTooltip';

interface SentimentBarProps {
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentBar({ positive, neutral, negative }: SentimentBarProps) {
  const total = positive + neutral + negative;
  if (total === 0) return null;

  const pPct = (positive / total) * 100;
  const nPct = (neutral / total) * 100;
  const negPct = (negative / total) * 100;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sentiment-Verteilung</span>
        <InfoTooltip text="Wie werden Sie in KI-Antworten dargestellt? Positiv = empfehlend, Neutral = erwähnend, Negativ = kritisch." />
      </div>
      <div className="flex h-4 rounded-full overflow-hidden">
        {pPct > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${pPct}%` }} />}
        {nPct > 0 && <div className="bg-gray-400 transition-all" style={{ width: `${nPct}%` }} />}
        {negPct > 0 && <div className="bg-rose-500 transition-all" style={{ width: `${negPct}%` }} />}
      </div>
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-emerald-600 dark:text-emerald-400">{positive} positiv</span>
        <span className="text-gray-500">{neutral} neutral</span>
        <span className="text-rose-600 dark:text-rose-400">{negative} negativ</span>
      </div>
    </div>
  );
}
