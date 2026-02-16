'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchRanking, RankingResponse } from '@/lib/api';
import RankingTable from '@/components/RankingTable';
import LeadForm from '@/components/LeadForm';
import { formatDate } from '@/lib/utils';

export default function RankingPage({ params }: { params: { industry: string } }) {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRanking = async () => {
      try {
        setLoading(true);
        const data = await fetchRanking(params.industry);
        setRanking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [params.industry]);

  const handleRowClick = (entry: any) => {
    if (entry.scan_id) {
      router.push(`/report/${entry.scan_id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Lade Ranking-Daten...</p>
        </div>
      </div>
    );
  }

  if (error || !ranking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-rose-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Fehler</h2>
          <p className="text-gray-400">{error || 'Daten konnten nicht geladen werden.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">
            <span className="text-white">{ranking.industry_name}</span>
            <span className="text-cyan-400"> Rankings</span>
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            KI-Sichtbarkeits-Ranking für die {ranking.industry_name}-Branche. Gemessen über ChatGPT, Claude, Gemini und Perplexity.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{ranking.total_companies} Unternehmen analysiert</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Letzte Aktualisierung: {formatDate(ranking.last_updated)}</span>
            </div>
          </div>
        </div>

        {/* Ranking Table */}
        <div className="mb-16">
          <RankingTable entries={ranking.entries} onRowClick={handleRowClick} />
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl p-8 lg:p-12">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ihr Unternehmen fehlt im Ranking?
            </h2>
            <p className="text-lg text-gray-300">
              Lassen Sie uns Ihre KI-Sichtbarkeit analysieren und erfahren Sie, wie Sie Ihre Position verbessern können.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <LeadForm industryId={ranking.industry_id} sourcePage={`/ranking/${params.industry}`} />
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Wie wird der Score berechnet?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Wir stellen jeder KI-Plattform über 50 branchenrelevante Fragen und messen, wie oft und in welcher Position Ihr Unternehmen genannt wird.
                Der Gesamt-Score ist der Durchschnitt aller Plattform-Scores und spiegelt Ihre durchschnittliche KI-Sichtbarkeit wider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
