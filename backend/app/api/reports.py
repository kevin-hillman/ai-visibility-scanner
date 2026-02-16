"""
Reports API Endpoints.
Liefert vollständige Reports mit Company- und Scan-Daten.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Scan, Company
from app.schemas import ReportResponse, CompanyResponse, ScanResponse

router = APIRouter()


@router.get("/{scan_id}", response_model=ReportResponse)
def get_report(
    scan_id: str,
    db: Session = Depends(get_db)
) -> ReportResponse:
    """
    Holt den vollständigen Report für einen Scan.
    Enthält Company-Daten, Scan-Ergebnisse und Recommendations.
    """
    # Scan holen
    scan = db.query(Scan).filter(Scan.id == scan_id).first()

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with id '{scan_id}' not found"
        )

    # Prüfen ob Scan completed ist
    if scan.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scan is not completed yet (status: {scan.status})"
        )

    # Company holen
    company = db.query(Company).filter(Company.id == scan.company_id).first()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id '{scan.company_id}' not found"
        )

    # Response zusammenbauen
    company_response = CompanyResponse(
        id=company.id,
        domain=company.domain,
        name=company.name,
        industry_id=company.industry_id,
        description=company.description,
        location=company.location,
        overall_score=scan.overall_score,
        rank=None  # Rank wird nur in Rankings berechnet
    )

    scan_response = ScanResponse(
        id=scan.id,
        company_id=scan.company_id,
        status=scan.status,
        overall_score=scan.overall_score,
        platform_scores=scan.platform_scores,
        query_results=scan.query_results,
        analysis=scan.analysis,
        recommendations=scan.recommendations,
        started_at=scan.started_at,
        completed_at=scan.completed_at
    )

    return ReportResponse(
        company=company_response,
        scan=scan_response,
        recommendations=scan.recommendations
    )


@router.get("/{scan_id}/html", response_class=HTMLResponse)
def get_report_html(
    scan_id: str,
    db: Session = Depends(get_db)
) -> str:
    """
    Liefert den HTML-Report direkt als HTML-Response.
    Kann direkt im Browser angezeigt werden.
    """
    # Scan holen
    scan = db.query(Scan).filter(Scan.id == scan_id).first()

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with id '{scan_id}' not found"
        )

    # Prüfen ob Scan completed ist
    if scan.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scan is not completed yet (status: {scan.status})"
        )

    # Prüfen ob HTML-Report existiert
    if not scan.report_html:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HTML report not available for this scan"
        )

    return scan.report_html
