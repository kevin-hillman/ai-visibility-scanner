"""
Rankings API Endpoints.
Erstellt Rankings von Companies basierend auf ihren Scan-Scores.
"""
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.dependencies import get_db
from app.models import Company, Scan
from app.schemas import RankingResponse, RankingEntry
from app.api.industries import load_industry_config
from app.dependencies import get_settings
from app.config import Settings

router = APIRouter()


@router.get("/{industry_id}", response_model=RankingResponse)
def get_industry_ranking(
    industry_id: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
) -> RankingResponse:
    """
    Holt das Ranking aller Companies einer Industry.

    Für jede Company wird der neueste completed Scan verwendet.
    Sortierung nach overall_score (höchster Score = Rang 1).
    """
    # Industry Config laden für Display Name
    try:
        industry_config = load_industry_config(industry_id, settings.INDUSTRY_CONFIG_DIR)
        industry_name = industry_config.get("display_name", industry_id)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Industry '{industry_id}' not found"
        )

    # Alle Companies der Industry holen
    companies = db.query(Company).filter(Company.industry_id == industry_id).all()

    if not companies:
        return RankingResponse(
            industry_id=industry_id,
            industry_name=industry_name,
            total_companies=0,
            entries=[],
            last_updated=None
        )

    # Für jede Company den neuesten completed Scan holen
    ranking_data = []
    last_updated = None

    for company in companies:
        # Neuesten completed Scan holen
        latest_scan = (
            db.query(Scan)
            .filter(Scan.company_id == company.id)
            .filter(Scan.status == "completed")
            .order_by(desc(Scan.completed_at))
            .first()
        )

        if latest_scan and latest_scan.overall_score is not None:
            ranking_data.append({
                "company_name": company.name,
                "domain": company.domain,
                "overall_score": latest_scan.overall_score,
                "platform_scores": latest_scan.platform_scores,
                "industry_id": company.industry_id,
                "completed_at": latest_scan.completed_at
            })

            # Last updated tracken
            if last_updated is None or latest_scan.completed_at > last_updated:
                last_updated = latest_scan.completed_at

    # Nach Score sortieren (höchster zuerst)
    ranking_data.sort(key=lambda x: x["overall_score"], reverse=True)

    # Pagination anwenden
    paginated_data = ranking_data[offset:offset + limit]

    # Ränge berechnen (basierend auf Position nach Pagination)
    entries = [
        RankingEntry(
            rank=offset + idx + 1,
            company_name=item["company_name"],
            domain=item["domain"],
            overall_score=item["overall_score"],
            platform_scores=item["platform_scores"],
            industry_id=item["industry_id"]
        )
        for idx, item in enumerate(paginated_data)
    ]

    return RankingResponse(
        industry_id=industry_id,
        industry_name=industry_name,
        total_companies=len(ranking_data),
        entries=entries,
        last_updated=last_updated
    )
