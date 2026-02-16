"""
Leads API Endpoints.
Erfasst und verwaltet Leads (Interessenten).
"""
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Lead
from app.schemas import LeadCreate, LeadResponse

router = APIRouter()


@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db)
) -> LeadResponse:
    """
    Erfasst einen neuen Lead.
    Wird verwendet wenn jemand über die Website Kontakt aufnimmt.
    """
    # Neuen Lead erstellen
    lead = Lead(
        id=str(uuid4()),
        name=lead_data.name,
        email=lead_data.email,
        company_name=lead_data.company_name,
        phone=lead_data.phone,
        industry_id=lead_data.industry_id,
        source_page=lead_data.source_page,
        message=lead_data.message
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    return LeadResponse(
        id=lead.id,
        created_at=lead.created_at
    )


@router.get("/")
def list_leads(
    industry_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Listet alle Leads auf (für Admin-Interface).
    Optional gefiltert nach industry_id.
    """
    query = db.query(Lead)

    if industry_id:
        query = query.filter(Lead.industry_id == industry_id)

    leads = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()

    return leads
