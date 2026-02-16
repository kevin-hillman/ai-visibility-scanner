'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchRanking, RankingResponse } from '@/lib/api';
import RankingList from '@/components/RankingList';
import LeadForm from '@/components/LeadForm';
import { formatDate } from '@/lib/utils';

export default function RankingPage({ params }: { params: { industry: string } }) {
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadPrefill, setLeadPrefill] = useState<{ company_name?: string; message?: string } | undefined>(undefined);
  const [leadFormNonce, setLeadFormNonce] = useState(0);

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

  const scrollToLeadForm = () => {
    const el = document.getElementById('lead-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRequestScan = (entry?: { company_name: string; domain: string }) => {
    if (entry) {
      setLeadPrefill({
        company_name: entry.company_name,
        message: `Bitte einen KI-Sichtbarkeits-Scan fuer ${entry.company_name} (${entry.domain}) erstellen.`,
      });
      // Remount the form so "initial" values update without setState-in-effect.
      setLeadFormNonce((n) => n + 1);
    } else {
      setLeadPrefill(undefined);
    }
    scrollToLeadForm();
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-6 w-40 rounded bg-white/10" />
            <div className="mt-6 h-14 w-full max-w-3xl rounded bg-white/10" />
            <div className="mt-3 h-6 w-full max-w-2xl rounded bg-white/10" />
            <div className="mt-10 space-y-3">
              <div className="h-24 rounded-2xl bg-white/5 border border-white/10" />
              <div className="h-24 rounded-2xl bg-white/5 border border-white/10" />
              <div className="h-24 rounded-2xl bg-white/5 border border-white/10" />
            </div>
          </div>
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

  const year = new Date().getFullYear();
  const lastUpdated = ranking.last_updated ? formatDate(ranking.last_updated) : '–';

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurueck zur Startseite
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-200">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Offizielles Ranking {year}
          </div>

          <h1 className="mt-5 text-4xl lg:text-6xl font-bold tracking-tight">
            <span className="text-white">{ranking.industry_name}</span>
            <span className="text-cyan-300"> Ranking {year}</span>
          </h1>

          <p className="mt-4 text-lg sm:text-xl text-gray-300 max-w-3xl">
            Rankings basieren auf KI-Erwaehnungen in mehreren Systemen (z.B. ChatGPT, Claude, Gemini und Perplexity).
          </p>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{ranking.total_companies} Unternehmen analysiert</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Letzte Aktualisierung: {lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Ranking List */}
        <div className="mb-16">
          <RankingList
            entries={ranking.entries}
            onRequestScan={(entry) => {
              if (!entry) return handleRequestScan();
              return handleRequestScan({ company_name: entry.company_name, domain: entry.domain });
            }}
          />
        </div>

        {/* CTA Section */}
        <div
          id="lead-form"
          className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl p-8 lg:p-12 scroll-mt-24"
        >
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ihr Unternehmen fehlt im Ranking?
            </h2>
            <p className="text-lg text-gray-300">
              Lassen Sie uns Ihre KI-Sichtbarkeit analysieren und erfahren Sie, wie Sie Ihre Position verbessern können.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <LeadForm
              key={`lead-form-${leadFormNonce}`}
              industryId={ranking.industry_id}
              sourcePage={`/ranking/${params.industry}`}
              prefill={leadPrefill}
            />
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
                Wir stellen KI-Plattformen ein Set branchenrelevanter Fragen und messen, wie oft und in welcher Position Ihr Unternehmen genannt wird.
                Der Gesamt-Score ist eine Aggregation der Plattform-Scores und spiegelt Ihre durchschnittliche KI-Sichtbarkeit wider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
