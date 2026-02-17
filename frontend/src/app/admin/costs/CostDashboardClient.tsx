'use client';

import { useEffect, useState } from 'react';
import {
  fetchCostSummary,
  fetchBudget,
  updateBudget,
  fetchScanCostList,
  fetchScanCosts,
  type CostSummary,
  type BudgetInfo,
  type ScanCostListEntry,
  type ScanCostDetail,
} from '@/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUSD(value: number): string {
  return `$${value.toFixed(4)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  chatgpt: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
  claude: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  gemini: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  perplexity: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
};

function getPlatformStyle(platform: string) {
  return PLATFORM_COLORS[platform.toLowerCase()] ?? { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' };
}

// ---------------------------------------------------------------------------
// KpiCard
// ---------------------------------------------------------------------------

function KpiCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-5">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlatformBreakdown
// ---------------------------------------------------------------------------

function PlatformBreakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 0.0001);

  return (
    <div className="space-y-3">
      {entries.map(([platform, cost]) => {
        const style = getPlatformStyle(platform);
        return (
          <div key={platform}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300 capitalize">{platform}</span>
              <span className="text-gray-500 dark:text-gray-400 tabular-nums">{formatUSD(cost)}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${style.dot}`}
                style={{ width: `${(cost / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
      {entries.length === 0 && <div className="text-sm text-gray-400">Keine Daten</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BudgetSection
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ApiCallTable – detail table for a single scan's API calls
// ---------------------------------------------------------------------------

function ApiCallTable({ detail }: { detail: ScanCostDetail }) {
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-[#2e3039]">
            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Plattform</th>
            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Modell</th>
            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium min-w-[200px]">Query</th>
            <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Tokens</th>
            <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Kosten</th>
            <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Latenz</th>
            <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {detail.calls.map((call) => {
            const style = getPlatformStyle(call.platform);
            const isExpanded = expandedQuery === call.id;
            const queryPreview = call.query.length > 80 ? call.query.slice(0, 80) + '...' : call.query;
            const latencySeconds = (call.latency_ms / 1000).toFixed(1);

            return (
              <tr
                key={call.id}
                className="border-b border-gray-100 dark:border-[#2e3039]/50 hover:bg-gray-50 dark:hover:bg-[#1e2130]"
              >
                <td className="py-2.5 px-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    <span className="capitalize">{call.platform}</span>
                  </span>
                </td>
                <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{call.model}</td>
                <td className="py-2.5 px-3">
                  <button
                    onClick={() => setExpandedQuery(isExpanded ? null : call.id)}
                    className="text-left text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    title={isExpanded ? 'Einklappen' : 'Vollen Prompt anzeigen'}
                  >
                    {isExpanded ? (
                      <span className="whitespace-pre-wrap break-all">{call.query}</span>
                    ) : (
                      <span>{queryPreview}</span>
                    )}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
                  {call.input_tokens.toLocaleString()}&nbsp;&rarr;&nbsp;{call.output_tokens.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 dark:text-gray-300 tabular-nums font-medium">
                  {formatUSD(call.cost_usd)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                  {latencySeconds}s
                </td>
                <td className="py-2.5 px-3 text-center">
                  {call.success ? (
                    <span className="text-emerald-500" title="Erfolgreich">&#10003;</span>
                  ) : (
                    <span className="text-rose-500" title="Fehlgeschlagen">&#10007;</span>
                  )}
                </td>
              </tr>
            );
          })}
          {detail.calls.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-gray-400">Keine API-Calls gefunden</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScanRow – a single expandable row in the scan table
// ---------------------------------------------------------------------------

function ScanRow({
  scan,
  isExpanded,
  isLoading,
  detail,
  onToggle,
}: {
  scan: ScanCostListEntry;
  isExpanded: boolean;
  isLoading: boolean;
  detail: ScanCostDetail | null;
  onToggle: () => void;
}) {
  const platformEntries = Object.entries(scan.platform_breakdown);

  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-gray-200 dark:border-[#2e3039] cursor-pointer transition-colors ${
          isExpanded
            ? 'bg-gray-50 dark:bg-[#1e2130]'
            : 'hover:bg-gray-50 dark:hover:bg-[#1e2130]'
        }`}
      >
        <td className="py-3 px-4">
          <span className={`inline-block w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            &#9654;
          </span>
        </td>
        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{scan.company_name}</td>
        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{scan.company_domain}</td>
        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm tabular-nums whitespace-nowrap">
          {formatDate(scan.started_at)}
        </td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            scan.status === 'completed'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : scan.status === 'failed'
                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          }`}>
            {scan.status}
          </span>
        </td>
        <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium tabular-nums">
          {formatUSD(scan.total_cost_usd)}
        </td>
        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 tabular-nums">
          {scan.total_tokens.toLocaleString()}
        </td>
        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 tabular-nums">
          {scan.total_calls}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1">
            {platformEntries.map(([platform]) => {
              const style = getPlatformStyle(platform);
              return (
                <span
                  key={platform}
                  className={`w-2.5 h-2.5 rounded-full ${style.dot}`}
                  title={platform}
                />
              );
            })}
          </div>
        </td>
      </tr>

      {/* Expanded detail section */}
      {isExpanded && (
        <tr>
          <td colSpan={9} className="bg-gray-50/50 dark:bg-[#161820] px-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Lade API-Call-Details...</span>
              </div>
            ) : detail ? (
              <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2e3039] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    API-Calls ({detail.calls.length})
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Gesamt: {formatUSD(detail.total_cost_usd)} &middot; {detail.total_tokens.toLocaleString()} Tokens
                  </span>
                </div>
                <ApiCallTable detail={detail} />
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">Fehler beim Laden der Details</div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ScanTable – the main scan list
// ---------------------------------------------------------------------------

function ScanTable({ scans }: { scans: ScanCostListEntry[] }) {
  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const [scanDetails, setScanDetails] = useState<Record<string, ScanCostDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const handleToggle = async (scanId: string) => {
    if (expandedScan === scanId) {
      setExpandedScan(null);
      return;
    }
    setExpandedScan(scanId);
    if (!scanDetails[scanId]) {
      setLoadingDetail(scanId);
      try {
        const detail = await fetchScanCosts(scanId);
        setScanDetails((prev) => ({ ...prev, [scanId]: detail }));
      } catch (e) {
        console.error('Fehler beim Laden der Scan-Details:', e);
      } finally {
        setLoadingDetail(null);
      }
    }
  };

  // Sort by date, newest first
  const sorted = [...scans].sort((a, b) => {
    const da = a.started_at ? new Date(a.started_at).getTime() : 0;
    const db = b.started_at ? new Date(b.started_at).getTime() : 0;
    return db - da;
  });

  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2e3039]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scan-Details</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {scans.length} Scans &middot; Klicken zum Aufklappen der API-Call-Details
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#2e3039] bg-gray-50 dark:bg-[#161820]">
              <th className="w-10 py-3 px-4" />
              <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Firma</th>
              <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Domain</th>
              <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Datum</th>
              <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
              <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Kosten</th>
              <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Tokens</th>
              <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Calls</th>
              <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Plattformen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((scan) => (
              <ScanRow
                key={scan.scan_id}
                scan={scan}
                isExpanded={expandedScan === scan.scan_id}
                isLoading={loadingDetail === scan.scan_id}
                detail={scanDetails[scan.scan_id] ?? null}
                onToggle={() => handleToggle(scan.scan_id)}
              />
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  Keine Scans in diesem Monat
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CostDashboardClient – main component
// ---------------------------------------------------------------------------

export default function CostDashboardClient() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const [scans, setScans] = useState<ScanCostListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, b, sc] = await Promise.all([
        fetchCostSummary(),
        fetchBudget(),
        fetchScanCostList(),
      ]);
      setSummary(s);
      setBudget(b);
      setScans(sc);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-6 text-center">
          <p className="text-rose-600 dark:text-rose-400">{error}</p>
          <button onClick={loadData} className="mt-3 text-sm text-teal-600 hover:underline">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide uppercase mb-2">Admin</div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Kostenübersicht</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{summary.month}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Monatskosten" value={formatUSD(summary.total_cost_usd)} />
        <KpiCard
          label="API-Calls"
          value={summary.total_calls.toLocaleString()}
          subtitle={`${summary.total_tokens.toLocaleString()} Tokens`}
        />
        <KpiCard label="Ø pro Scan" value={formatUSD(summary.avg_cost_per_scan)} />
        <KpiCard
          label="Budget"
          value={budget && budget.budget_usd > 0 ? `${(budget.utilization * 100).toFixed(0)}%` : '–'}
          subtitle={budget && budget.budget_usd > 0 ? `${formatUSD(budget.spent_usd)} / ${formatUSD(budget.budget_usd)}` : 'Nicht gesetzt'}
        />
      </div>

      {/* Platform Breakdown + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kosten pro Plattform</h2>
          <PlatformBreakdown data={summary.platform_breakdown} />
        </div>

        <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monatsbudget</h2>
          <BudgetSection budget={budget} onUpdate={loadData} />
        </div>
      </div>

      {/* Scan Detail Table – PRIMARY focus */}
      <ScanTable scans={scans} />
    </div>
  );
}
