from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CompanyCreate(BaseModel):
    domain: str
    name: str
    industry_id: str
    description: str | None = None
    location: str | None = None
    website_url: str | None = None


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    domain: str
    name: str
    industry_id: str
    description: str | None = None
    location: str | None = None
    overall_score: float | None = None
    rank: int | None = None


class CompanyImport(BaseModel):
    domain: str
    name: str
    description: str | None = None
    location: str | None = None
    website_url: str | None = None


class ScanCreate(BaseModel):
    company_id: str
    industry_id: str


class ScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    status: str
    overall_score: float | None = None
    platform_scores: dict = {}
    query_results: list = []
    analysis: dict = {}
    competitors: list[dict] = []
    recommendations: list = []
    started_at: datetime | None = None
    completed_at: datetime | None = None


class RankingEntry(BaseModel):
    rank: int
    company_name: str
    domain: str
    overall_score: float
    platform_scores: dict
    industry_id: str
    scan_id: str


class RankingResponse(BaseModel):
    industry_id: str
    industry_name: str
    total_companies: int
    entries: list[RankingEntry]
    last_updated: datetime | None = None


class ReportResponse(BaseModel):
    company: CompanyResponse
    scan: ScanResponse
    recommendations: list[str]


class LeadCreate(BaseModel):
    name: str
    email: str
    company_name: str | None = None
    phone: str | None = None
    industry_id: str | None = None
    source_page: str | None = None
    message: str | None = None


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime


class IndustryInfo(BaseModel):
    id: str
    name: str
    display_name: str
    description: str
    total_companies: int
    avg_score: float | None = None
