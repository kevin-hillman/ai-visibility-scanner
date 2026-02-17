import RankingPageClient from './RankingPageClient';
import type { RankingResponse } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchRankingServer(industryId: string): Promise<RankingResponse> {
  const response = await fetch(`${API_BASE}/rankings/${industryId}`, {
    // Ranking changes when scans complete; keep reasonably fresh without hammering.
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ranking: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export default async function RankingPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;

  let initialRanking: RankingResponse | null = null;
  let initialError: string | null = null;

  try {
    initialRanking = await fetchRankingServer(industry);
  } catch (err) {
    initialError = err instanceof Error ? err.message : 'Fehler beim Laden der Daten';
  }

  return (
    <RankingPageClient
      key={industry}
      industry={industry}
      initialRanking={initialRanking}
      initialError={initialError}
    />
  );
}

