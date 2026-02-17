'use client';

import Link from 'next/link';
import type { ReportResponse } from '@/lib/api';
import ScoreCircle from '@/components/ScoreCircle';
import PlatformBar from '@/components/PlatformBar';
import RecommendationCard from '@/components/RecommendationCard';
import LeadForm from '@/components/LeadForm';
import KpiCard from '@/components/KpiCard';
import InfoTooltip from '@/components/InfoTooltip';
import SentimentBar from '@/components/SentimentBar';
import QueryTable from '@/components/QueryTable';

type ReportPageClientProps = {
  scanId: string;
  initialReport: ReportResponse | null;
  initialError: string | null;
};

export default function ReportPageClient({ scanId, initialReport, initialError }: ReportPageClientProps) {
  if (!initialReport) {
    return (
      <div className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Zurück zur Startseite
            </Link>
          </div>
          <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Report konnte nicht geladen werden</h2>
            <p className="text-gray-600 dark:text-gray-300">{initialError || 'Fehler beim Laden des Reports'}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-6 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">Neu laden</button>
          </div>
        </div>
      </div>
    );
  }

  const { company, scan, recommendations } = initialReport;
  const analysis = scan.analysis;

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Startseite</Link>
          <svg className="w-4 h-4 mx-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 dark:text-white font-medium">{company.name}</span>
        </div>

        <div className="mb-16">
          <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide uppercase mb-3">GEO Intelligence Report</div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white mb-3">{company.name}</h1>
          <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">{company.domain} ↗</a>
          {company.description && <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-3xl text-lg">{company.description}</p>}
        </div>

        <div className="mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Erwähnungsrate"
              value={`${(analysis.mention_rate ?? 0).toFixed(0)}%`}
              subtitle={`${analysis.total_mentions ?? 0} von ${analysis.total_queries ?? 0} Antworten`}
              tooltip="In wie vielen KI-Antworten wird Ihr Unternehmen erwähnt? Berechnet über alle Plattformen und Queries."
              colorClass={(analysis.mention_rate ?? 0) >= 50 ? 'text-emerald-600 dark:text-emerald-400' : (analysis.mention_rate ?? 0) >= 25 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400'}
            />
            <KpiCard
              label="Ø Position"
              value={analysis.avg_position ? `#${analysis.avg_position.toFixed(1)}` : '–'}
              subtitle="in KI-Antworten"
              tooltip="Durchschnittliche Listenposition wenn Ihr Unternehmen erwähnt wird. Niedrigere Zahl = prominenter platziert."
              colorClass={analysis.avg_position && analysis.avg_position <= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}
            />
            <KpiCard
              label="Queries analysiert"
              value={String(analysis.total_queries ?? 0)}
              subtitle="branchenspezifische Fragen"
              tooltip="Anzahl der branchenspezifischen Fragen, die an ChatGPT, Claude, Gemini und Perplexity gestellt wurden."
            />
            <KpiCard
              label="Sentiment"
              value={(() => {
                const sd = analysis.sentiment_distribution;
                if (!sd) return '–';
                const total = (sd.positive ?? 0) + (sd.neutral ?? 0) + (sd.negative ?? 0);
                return total > 0 ? `${Math.round(((sd.positive ?? 0) / total) * 100)}%` : '–';
              })()}
              subtitle="positiv"
              tooltip="Anteil positiver Erwähnungen. Zeigt, wie vorteilhaft KI-Chatbots über Ihr Unternehmen sprechen."
              colorClass="text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>

        <div className="mb-16 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-1.5 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">KI-Sichtbarkeit</h2>
            <InfoTooltip text="Gewichteter Durchschnitt Ihrer Sichtbarkeit über alle KI-Plattformen. Gewichtung: ChatGPT 35%, Claude 35%, Gemini 30%." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
            <div className="flex justify-center">
              <ScoreCircle score={scan.overall_score} size={180} label="Gesamt-Score" />
            </div>
            <div>
              <div className="space-y-5">
                <PlatformBar
                  platform="chatgpt"
                  score={scan.platform_scores.chatgpt}
                  mentionRate={analysis.platform_performance?.chatgpt?.mention_rate}
                  totalMentions={analysis.platform_performance?.chatgpt?.total_mentions}
                  totalQueries={analysis.platform_performance?.chatgpt?.total_queries}
                />
                <PlatformBar
                  platform="claude"
                  score={scan.platform_scores.claude}
                  mentionRate={analysis.platform_performance?.claude?.mention_rate}
                  totalMentions={analysis.platform_performance?.claude?.total_mentions}
                  totalQueries={analysis.platform_performance?.claude?.total_queries}
                />
                <PlatformBar
                  platform="gemini"
                  score={scan.platform_scores.gemini}
                  mentionRate={analysis.platform_performance?.gemini?.mention_rate}
                  totalMentions={analysis.platform_performance?.gemini?.total_mentions}
                  totalQueries={analysis.platform_performance?.gemini?.total_queries}
                />
                <PlatformBar
                  platform="perplexity"
                  score={scan.platform_scores.perplexity}
                  mentionRate={analysis.platform_performance?.perplexity?.mention_rate}
                  totalMentions={analysis.platform_performance?.perplexity?.total_mentions}
                  totalQueries={analysis.platform_performance?.perplexity?.total_queries}
                />
              </div>
              {analysis.sentiment_distribution && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <SentimentBar
                    positive={analysis.sentiment_distribution.positive ?? 0}
                    neutral={analysis.sentiment_distribution.neutral ?? 0}
                    negative={analysis.sentiment_distribution.negative ?? 0}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {analysis.top_competitors && analysis.top_competitors.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-1.5 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Wettbewerber im Vergleich</h2>
              <InfoTooltip text="Wie oft werden Ihre Wettbewerber in KI-Antworten zu den gleichen Fragen erwähnt?" />
            </div>
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6 shadow-sm max-w-3xl">
              {/* Own company first */}
              <div className="mb-5 pb-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{company.name} (Sie)</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{analysis.total_mentions ?? 0} Erwähnungen</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${Math.min(((analysis.total_mentions ?? 0) / Math.max(analysis.total_queries ?? 1, 1)) * 100, 100)}%` }} />
                </div>
              </div>
              {/* Competitors */}
              <div className="space-y-3">
                {analysis.top_competitors.slice(0, 8).map((c, i) => {
                  const maxMentions = Math.max(analysis.total_mentions ?? 0, ...analysis.top_competitors.map(tc => tc.mentions));
                  const widthPct = maxMentions > 0 ? (c.mentions / maxMentions) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{c.mentions}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all" style={{ width: `${widthPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {scan.query_results && scan.query_results.length > 0 && (
          <div className="mb-16">
            <QueryTable queries={scan.query_results} />
          </div>
        )}

        <div className="mb-16">
          <div className="flex items-center gap-1.5 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Detaillierte Analyse</h2>
            <InfoTooltip text="Automatisch erkannte Stärken, Schwächen und Chancen basierend auf der Auswertung aller KI-Antworten." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Stärken</h3>
                  </div>
                </div>
                <ul className="p-6 space-y-3">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><span className="text-emerald-500 mt-0.5 flex-shrink-0">&#10003;</span><span className="text-gray-700 dark:text-gray-300">{s}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.weaknesses && analysis.weaknesses.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-200 dark:border-rose-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="font-semibold text-rose-800 dark:text-rose-300">Schwächen</h3>
                  </div>
                </div>
                <ul className="p-6 space-y-3">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><span className="text-rose-500 mt-0.5 flex-shrink-0">&#10007;</span><span className="text-gray-700 dark:text-gray-300">{w}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.opportunities && analysis.opportunities.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">Chancen</h3>
                  </div>
                </div>
                <ul className="p-6 space-y-3">
                  {analysis.opportunities.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><span className="text-blue-500 mt-0.5 flex-shrink-0">&#8594;</span><span className="text-gray-700 dark:text-gray-300">{o}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-1.5 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Handlungsempfehlungen</h2>
              <InfoTooltip text="Konkrete Maßnahmen um Ihre Sichtbarkeit in KI-Chatbots zu verbessern, priorisiert nach erwartetem Impact." />
            </div>
            <div className="space-y-3">
              {recommendations.map((r, i) => <RecommendationCard key={i} index={i + 1} text={r} />)}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl p-8 lg:p-12 shadow-sm">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-3">KI-Sichtbarkeit verbessern?</h2>
            <p className="text-gray-600 dark:text-gray-400">Unsere GEO-Experten entwickeln mit Ihnen eine maßgeschneiderte Strategie.</p>
          </div>
          <div className="max-w-2xl mx-auto"><LeadForm sourcePage={`/report/${scanId}`} /></div>
        </div>
      </div>
    </div>
  );
}
