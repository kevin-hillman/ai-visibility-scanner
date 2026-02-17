'use client';

import { useEffect, useState } from 'react';
import {
  fetchCostSummary,
  fetchBudget,
  updateBudget,
  type CostSummary,
  type BudgetInfo,
} from '@/lib/api';

function formatUSD(value: number): string {
  return `$${value.toFixed(4)}`;
}

function KpiCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-5">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}

function PlatformBreakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 0.0001);

  const platformColors: Record<string, string> = {
    chatgpt: 'bg-green-500',
    claude: 'bg-orange-500',
    gemini: 'bg-blue-500',
    perplexity: 'bg-purple-500',
  };

  return (
    <div className="space-y-3">
      {entries.map(([platform, cost]) => (
        <div key={platform}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300 capitalize">{platform}</span>
            <span className="text-gray-500 dark:text-gray-400 tabular-nums">{formatUSD(cost)}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${platformColors[platform] || 'bg-teal-500'}`}
              style={{ width: `${(cost / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {entries.length === 0 && <div className="text-sm text-gray-400">Keine Daten</div>}
    </div>
  );
}

function DailyCostChart({ data }: { data: Array<{ date: string; cost: number }> }) {
  if (data.length === 0) return <div className="text-sm text-gray-400">Keine Daten</div>;

  const max = Math.max(...data.map((d) => d.cost), 0.0001);

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((day) => (
        <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
          <div
            className="w-full bg-teal-500 rounded-t min-h-[2px]"
            style={{ height: `${(day.cost / max) * 100}%` }}
            title={`${day.date}: ${formatUSD(day.cost)}`}
          />
          <div className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">
            {day.date.slice(-2)}
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetSection({ budget, onUpdate }: { budget: BudgetInfo | null; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    setSaving(true);
    try {
      await updateBudget(value);
      setEditing(false);
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  if (!budget || budget.budget_usd === 0) {
    return (
      <div className="text-center py-4">
        {editing ? (
          <div className="flex items-center gap-2 justify-center">
            <input
              type="number"
              step="0.01"
              placeholder="Budget in USD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white text-sm w-32"
            />
            <button onClick={handleSave} disabled={saving} className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50">
              Setzen
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700">
              Abbrechen
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
            Monatsbudget festlegen
          </button>
        )}
      </div>
    );
  }

  const color = budget.utilization < budget.warning_threshold
    ? 'text-emerald-600 dark:text-emerald-400'
    : budget.utilization < 1.0
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-rose-600 dark:text-rose-400';

  const barColor = budget.utilization < budget.warning_threshold
    ? 'bg-emerald-500'
    : budget.utilization < 1.0
      ? 'bg-yellow-500'
      : 'bg-rose-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-700 dark:text-gray-300">
          {formatUSD(budget.spent_usd)} / {formatUSD(budget.budget_usd)}
        </span>
        <span className={`font-semibold ${color}`}>{(budget.utilization * 100).toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(budget.utilization * 100, 100)}%` }}
        />
      </div>
      {budget.utilization >= budget.warning_threshold && (
        <div className={`mt-2 text-xs ${color}`}>
          {budget.utilization >= 1.0 ? 'Budget überschritten!' : 'Budget-Warnung: Schwelle erreicht'}
        </div>
      )}
    </div>
  );
}

export default function CostDashboardClient() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, b] = await Promise.all([fetchCostSummary(), fetchBudget()]);
      setSummary(s);
      setBudget(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-6 text-center">
          <p className="text-rose-600 dark:text-rose-400">{error}</p>
          <button onClick={loadData} className="mt-3 text-sm text-teal-600 hover:underline">Erneut versuchen</button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide uppercase mb-2">Admin</div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Kostenübersicht</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{summary.month}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Monatskosten" value={formatUSD(summary.total_cost_usd)} />
        <KpiCard label="API-Calls" value={summary.total_calls.toLocaleString()} subtitle={`${summary.total_tokens.toLocaleString()} Tokens`} />
        <KpiCard label="Ø pro Scan" value={formatUSD(summary.avg_cost_per_scan)} />
        <KpiCard
          label="Budget"
          value={budget && budget.budget_usd > 0 ? `${(budget.utilization * 100).toFixed(0)}%` : '–'}
          subtitle={budget && budget.budget_usd > 0 ? `${formatUSD(budget.spent_usd)} / ${formatUSD(budget.budget_usd)}` : 'Nicht gesetzt'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kosten pro Plattform</h2>
          <PlatformBreakdown data={summary.platform_breakdown} />
        </div>

        <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tägliche Kosten</h2>
          <DailyCostChart data={summary.daily_costs} />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monatsbudget</h2>
        <BudgetSection budget={budget} onUpdate={loadData} />
      </div>
    </div>
  );
}
