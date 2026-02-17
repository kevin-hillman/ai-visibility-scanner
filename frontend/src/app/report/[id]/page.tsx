import ReportPageClient from './ReportPageClient';
import type { ReportResponse } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchReportServer(scanId: string): Promise<ReportResponse> {
  const response = await fetch(`${API_BASE}/reports/${scanId}`, {
    // Completed scans are mostly immutable; keep fresh enough for demos.
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let initialReport: ReportResponse | null = null;
  let initialError: string | null = null;

  try {
    initialReport = await fetchReportServer(id);
  } catch (err) {
    initialError = err instanceof Error ? err.message : 'Fehler beim Laden des Reports';
  }

  return (
    <ReportPageClient
      key={id}
      scanId={id}
      initialReport={initialReport}
      initialError={initialError}
    />
  );
}

