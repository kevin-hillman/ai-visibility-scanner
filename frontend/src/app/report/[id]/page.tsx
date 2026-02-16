'use client';

import { useEffect, useState } from 'react';
import { fetchReport, ReportResponse } from '@/lib/api';
import ScoreCircle from '@/components/ScoreCircle';
import PlatformBar from '@/components/PlatformBar';
import RecommendationCard from '@/components/RecommendationCard';
import LeadForm from '@/components/LeadForm';

export default function ReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const data = await fetchReport(params.id);
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden des Reports');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Lade Report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-rose-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Fehler</h2>
          <p className="text-gray-400">{error || 'Report konnte nicht geladen werden.'}</p>
        </div>
      </div>
    );
  }

  const { company, scan, recommendations } = report;
  const analysis = scan.analysis || { strengths: [], weaknesses: [], opportunities: [] };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-medium mb-4">
            GEO Intelligence Report
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">
            {company.name}
          </h1>
          <a
            href={`https://${company.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 transition-colors text-lg"
          >
            {company.domain} ↗
          </a>
          {company.description && (
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">{company.description}</p>
          )}
        </div>

        {/* Overall Score */}
        <div className="mb-16 flex justify-center">
          <ScoreCircle score={scan.overall_score} size={240} label="Gesamt-Score" />
        </div>

        {/* Platform Breakdown */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Performance nach <span className="text-cyan-400">Plattform</span>
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <PlatformBar platform="chatgpt" score={scan.platform_scores.chatgpt} />
            <PlatformBar platform="claude" score={scan.platform_scores.claude} />
            <PlatformBar platform="gemini" score={scan.platform_scores.gemini} />
            <PlatformBar platform="perplexity" score={scan.platform_scores.perplexity} />
          </div>
        </div>

        {/* Analysis Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Detaillierte <span className="text-cyan-400">Analyse</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Strengths */}
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-white">Stärken</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span className="text-gray-300 text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {analysis.weaknesses && analysis.weaknesses.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-white">Schwächen</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-rose-400 mt-1">✗</span>
                      <span className="text-gray-300 text-sm">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities */}
            {analysis.opportunities && analysis.opportunities.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <h3 className="text-xl font-bold text-white">Chancen</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">→</span>
                      <span className="text-gray-300 text-sm">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Competitors */}
        {scan.competitors && scan.competitors.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Top <span className="text-cyan-400">Wettbewerber</span>
            </h2>
            <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Unternehmen</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Nennungen</th>
                  </tr>
                </thead>
                <tbody>
                  {scan.competitors.slice(0, 10).map((competitor, index) => (
                    <tr key={index} className="border-t border-white/5">
                      <td className="py-3 px-4 text-white">{competitor.name}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold text-sm">
                          {competitor.mentions}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Konkrete <span className="text-cyan-400">Handlungsempfehlungen</span>
            </h2>
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard key={index} index={index + 1} text={recommendation} />
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl p-8 lg:p-12">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Möchten Sie Ihre KI-Sichtbarkeit verbessern?
            </h2>
            <p className="text-lg text-gray-300">
              Unsere GEO-Experten entwickeln mit Ihnen eine maßgeschneiderte Strategie, um Ihre Position
              in ChatGPT, Claude, Gemini und Perplexity nachhaltig zu stärken.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <LeadForm sourcePage={`/report/${params.id}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
