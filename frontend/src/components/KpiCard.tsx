import InfoTooltip from './InfoTooltip';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  tooltip: string;
  colorClass?: string;
}

export default function KpiCard({ label, value, subtitle, tooltip, colorClass = 'text-gray-900 dark:text-white' }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <InfoTooltip text={tooltip} />
      </div>
      <div className={`text-3xl font-semibold tabular-nums ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}
