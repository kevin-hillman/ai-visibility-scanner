'use client';

import Link from 'next/link';
import type { ReportResponse } from '@/lib/api';
import ScoreCircle from '@/components/ScoreCircle';
import PlatformBar from '@/components/PlatformBar';
import RecommendationCard from '@/components/RecommendationCard';
import LeadForm from '@/components/LeadForm';

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
              Zurueck zur Startseite
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
  const analysis = scan.analysis || { strengths: [], weaknesses: [], opportunities: [] };

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

        <div className="mb-16 flex justify-center">
          <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl p-8 shadow-sm">
            <ScoreCircle score={scan.overall_score} size={220} label="Gesamt-Score" />
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Performance nach Plattform</h2>
          <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6 shadow-sm">
            <div className="space-y-5">
              <PlatformBar platform="chatgpt" score={scan.platform_scores.chatgpt} />
              <PlatformBar platform="claude" score={scan.platform_scores.claude} />
              <PlatformBar platform="gemini" score={scan.platform_scores.gemini} />
              <PlatformBar platform="perplexity" score={scan.platform_scores.perplexity} />
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Detaillierte Analyse</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Staerken</h3>
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
                    <h3 className="font-semibold text-rose-800 dark:text-rose-300">Schwaechen</h3>
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

        {scan.competitors && scan.competitors.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Top Wettbewerber</h2>
            <div className="max-w-2xl bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200 dark:border-[#2e3039]"><th className="text-left py-3 px-5 text-sm font-medium text-gray-500 dark:text-gray-400">Unternehmen</th><th className="text-right py-3 px-5 text-sm font-medium text-gray-500 dark:text-gray-400">Nennungen</th></tr></thead>
                <tbody>
                  {scan.competitors.slice(0, 10).map((c, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-[#2e3039] even:bg-gray-50 dark:even:bg-white/[0.02]">
                      <td className="py-3 px-5 text-gray-900 dark:text-white text-sm">{c.name}</td>
                      <td className="py-3 px-5 text-right"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-semibold text-sm">{c.mentions}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Handlungsempfehlungen</h2>
            <div className="space-y-3">
              {recommendations.map((r, i) => <RecommendationCard key={i} index={i + 1} text={r} />)}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl p-8 lg:p-12 shadow-sm">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-3">KI-Sichtbarkeit verbessern?</h2>
            <p className="text-gray-600 dark:text-gray-400">Unsere GEO-Experten entwickeln mit Ihnen eine massgeschneiderte Strategie.</p>
          </div>
          <div className="max-w-2xl mx-auto"><LeadForm sourcePage={`/report/${scanId}`} /></div>
        </div>
      </div>
    </div>
  );
}
