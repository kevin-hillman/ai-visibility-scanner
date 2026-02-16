"""
Companies API Endpoints.
Verwaltet Unternehmen in der Datenbank.
"""
from typing import Optional, List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies import get_db
from app.models import Company
from app.schemas import CompanyCreate, CompanyResponse, CompanyImport

router = APIRouter()


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db)
) -> CompanyResponse:
    """
    Erstellt ein neues Unternehmen in der Datenbank.
    """
    # Prüfen ob Domain bereits existiert
    existing = db.query(Company).filter(Company.domain == company_data.domain).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Company with domain '{company_data.domain}' already exists"
        )

    # Neue Company erstellen
    company = Company(
        id=str(uuid4()),
        domain=company_data.domain,
        name=company_data.name,
        industry_id=company_data.industry_id,
        description=company_data.description,
        location=company_data.location,
        website_url=company_data.website_url,
        extra_data={}
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    return CompanyResponse(
        id=company.id,
        domain=company.domain,
        name=company.name,
        industry_id=company.industry_id,
        description=company.description,
        location=company.location,
        overall_score=None,
        rank=None
    )


@router.get("/", response_model=List[CompanyResponse])
def list_companies(
    industry_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[CompanyResponse]:
    """
    Listet alle Unternehmen auf.
    Optional gefiltert nach industry_id.
    """
    query = db.query(Company)

    if industry_id:
        query = query.filter(Company.industry_id == industry_id)

    companies = query.offset(skip).limit(limit).all()

    return [
        CompanyResponse(
            id=c.id,
            domain=c.domain,
            name=c.name,
            industry_id=c.industry_id,
            description=c.description,
            location=c.location,
            overall_score=None,
            rank=None
        )
        for c in companies
    ]


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: str,
    db: Session = Depends(get_db)
) -> CompanyResponse:
    """
    Holt ein einzelnes Unternehmen anhand der ID.
    """
    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id '{company_id}' not found"
        )

    return CompanyResponse(
        id=company.id,
        domain=company.domain,
        name=company.name,
        industry_id=company.industry_id,
        description=company.description,
        location=company.location,
        overall_score=None,
        rank=None
    )


@router.post("/import", response_model=List[CompanyResponse], status_code=status.HTTP_201_CREATED)
def import_companies(
    companies_data: List[CompanyImport],
    industry_id: str = Query(...),
    db: Session = Depends(get_db)
) -> List[CompanyResponse]:
    """
    Bulk-Import von Unternehmen aus einer JSON-Liste.
    Alle Companies bekommen die gleiche industry_id.
    """
    created_companies = []

    for company_data in companies_data:
        # Prüfen ob Domain bereits existiert
        existing = db.query(Company).filter(Company.domain == company_data.domain).first()
        if existing:
            # Überspringen wenn bereits vorhanden
            continue

        # Neue Company erstellen
        company = Company(
            id=str(uuid4()),
            domain=company_data.domain,
            name=company_data.name,
            industry_id=industry_id,
            description=company_data.description,
            location=company_data.location,
            website_url=company_data.website_url,
            extra_data={}
        )

        db.add(company)
        created_companies.append(company)

    db.commit()

    # Refresh all created companies
    for company in created_companies:
        db.refresh(company)

    return [
        CompanyResponse(
            id=c.id,
            domain=c.domain,
            name=c.name,
            industry_id=c.industry_id,
            description=c.description,
            location=c.location,
            overall_score=None,
            rank=None
        )
        for c in created_companies
    ]


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: str,
    db: Session = Depends(get_db)
) -> None:
    """
    Löscht ein Unternehmen aus der Datenbank.
    Achtung: Cascading Delete löscht auch alle zugehörigen Scans.
    """
    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id '{company_id}' not found"
        )

    db.delete(company)
    db.commit()
