const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Types
export interface PlatformScores {
  chatgpt: number;
  claude: number;
  gemini: number;
  perplexity: number;
}

export interface RankingEntry {
  rank: number;
  company_name: string;
  domain: string;
  overall_score: number;
  platform_scores: PlatformScores;
  industry_id: string;
  scan_id?: string;
}

export interface RankingResponse {
  industry_id: string;
  industry_name: string;
  total_companies: number;
  entries: RankingEntry[];
  last_updated: string | null;
}

export interface Industry {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

export interface CompanyInfo {
  id: string;
  domain: string;
  name: string;
  description?: string;
  website?: string;
}

export interface QueryResult {
  query: string;
  category: string;
  intent: string;
  platform: string;
  model: string;
  response_text: string;
  mentioned: boolean;
  mention_type: string;
  mention_count: number;
  position: number | null;
  context: string;
  sentiment: string;
  competitors_mentioned: string[];
}

export interface PlatformPerformance {
  mention_rate: number;
  total_queries: number;
  total_mentions: number;
}

export interface ScanAnalysis {
  total_queries: number;
  total_mentions: number;
  mention_rate: number;
  avg_position: number | null;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  top_competitors: Array<{ name: string; mentions: number }>;
  best_categories: string[];
  worst_categories: string[];
  platform_performance: Record<string, PlatformPerformance>;
}

export interface ScanInfo {
  id: string;
  overall_score: number;
  platform_scores: PlatformScores;
  query_results: QueryResult[];
  analysis: ScanAnalysis;
  competitors?: Array<{ name: string; mentions: number }>;
  started_at?: string;
  completed_at?: string;
}

export interface ReportResponse {
  company: CompanyInfo;
  scan: ScanInfo;
  recommendations: string[];
}

export interface LeadData {
  name: string;
  email: string;
  company_name?: string;
  phone?: string;
  industry_id?: string;
  source_page?: string;
  message?: string;
}

// API Functions
export async function fetchRanking(industryId: string): Promise<RankingResponse> {
  const response = await fetch(`${API_BASE}/rankings/${industryId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ranking: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchReport(scanId: string): Promise<ReportResponse> {
  const response = await fetch(`${API_BASE}/reports/${scanId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch report: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchIndustries(): Promise<Industry[]> {
  const response = await fetch(`${API_BASE}/industries`);
  if (!response.ok) {
    throw new Error(`Failed to fetch industries: ${response.statusText}`);
  }
  return response.json();
}

export async function submitLead(data: LeadData): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit lead: ${response.statusText}`);
  }

  return response.json();
}
