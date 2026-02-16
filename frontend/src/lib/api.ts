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
  last_updated: string;
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

export interface ScanInfo {
  id: string;
  overall_score: number;
  platform_scores: PlatformScores;
  query_results?: any[];
  analysis?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
  };
  competitors?: Array<{
    name: string;
    mentions: number;
  }>;
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
