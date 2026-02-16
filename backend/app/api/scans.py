"""
Scans API Endpoints.
Verwaltet Scans und führt sie aus.
"""
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_settings
from app.models import Company, Scan
from app.schemas import ScanCreate, ScanResponse
from app.workers.scan_worker import run_scan
from app.config import Settings

router = APIRouter()


@router.post("/", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
def create_scan(
    scan_data: ScanCreate,
    db: Session = Depends(get_db)
) -> ScanResponse:
    """
    Erstellt einen neuen Scan mit status='pending'.
    Der Scan muss dann mit POST /{scan_id}/run gestartet werden.
    """
    # Prüfen ob Company existiert
    company = db.query(Company).filter(Company.id == scan_data.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id '{scan_data.company_id}' not found"
        )

    # Neuen Scan erstellen
    scan = Scan(
        id=str(uuid4()),
        company_id=scan_data.company_id,
        industry_id=scan_data.industry_id,
        status="pending",
        overall_score=None,
        platform_scores={},
        query_results=[],
        analysis={},
        recommendations=[],
        report_html=None,
        error_message=None
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)

    return ScanResponse(
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


@router.post("/bulk", response_model=List[ScanResponse], status_code=status.HTTP_201_CREATED)
def create_bulk_scans(
    industry_id: str,
    db: Session = Depends(get_db)
) -> List[ScanResponse]:
    """
    Erstellt Scans für alle Companies einer Industry.
    Alle Scans haben status='pending' und müssen einzeln mit /run gestartet werden.
    """
    # Alle Companies der Industry holen
    companies = db.query(Company).filter(Company.industry_id == industry_id).all()

    if not companies:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No companies found for industry '{industry_id}'"
        )

    created_scans = []

    for company in companies:
        scan = Scan(
            id=str(uuid4()),
            company_id=company.id,
            industry_id=industry_id,
            status="pending",
            overall_score=None,
            platform_scores={},
            query_results=[],
            analysis={},
            recommendations=[],
            report_html=None,
            error_message=None
        )

        db.add(scan)
        created_scans.append(scan)

    db.commit()

    # Refresh all created scans
    for scan in created_scans:
        db.refresh(scan)

    return [
        ScanResponse(
            id=s.id,
            company_id=s.company_id,
            status=s.status,
            overall_score=s.overall_score,
            platform_scores=s.platform_scores,
            query_results=s.query_results,
            analysis=s.analysis,
            recommendations=s.recommendations,
            started_at=s.started_at,
            completed_at=s.completed_at
        )
        for s in created_scans
    ]


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: str,
    db: Session = Depends(get_db)
) -> ScanResponse:
    """
    Holt den aktuellen Status und die Ergebnisse eines Scans.
    """
    scan = db.query(Scan).filter(Scan.id == scan_id).first()

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with id '{scan_id}' not found"
        )

    return ScanResponse(
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


@router.post("/{scan_id}/run", response_model=ScanResponse)
async def run_scan_endpoint(
    scan_id: str,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
) -> ScanResponse:
    """
    Führt einen Scan aus.

    Der komplette Workflow wird synchron ausgeführt:
    1. Queries generieren
    2. LLMs abfragen
    3. Responses analysieren
    4. Scores berechnen
    5. Report generieren
    6. Status auf 'completed' setzen

    In Production würde man BackgroundTasks oder Celery verwenden.
    Für MVP ist synchrone Ausführung ok.
    """
    # Prüfen ob Scan existiert
    scan = db.query(Scan).filter(Scan.id == scan_id).first()

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with id '{scan_id}' not found"
        )

    # Prüfen ob Scan bereits läuft oder fertig ist
    if scan.status == "running":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scan is already running"
        )

    if scan.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scan is already completed"
        )

    # Scan ausführen
    await run_scan(scan_id, db, settings)

    # Scan neu laden
    db.refresh(scan)

    return ScanResponse(
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
