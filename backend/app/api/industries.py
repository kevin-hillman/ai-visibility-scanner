"""
Industries API Endpoints.
Liefert Informationen über verfügbare Industries.
"""
from typing import List
from pathlib import Path

import yaml
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies import get_db, get_settings
from app.models import Company, Scan
from app.schemas import IndustryInfo
from app.config import Settings

router = APIRouter()


def load_industry_config(industry_id: str, config_dir: str) -> dict:
    """
    Lädt die Industry-Konfiguration aus einer YAML-Datei.

    Args:
        industry_id: ID der Industry (z.B. "cybersecurity")
        config_dir: Pfad zum Verzeichnis mit den YAML-Dateien

    Returns:
        Dict mit der Industry-Konfiguration

    Raises:
        FileNotFoundError: Wenn die Config-Datei nicht existiert
    """
    path = Path(config_dir) / f"{industry_id}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Industry config not found: {industry_id}")

    with open(path) as f:
        return yaml.safe_load(f)


@router.get("/", response_model=List[IndustryInfo])
def list_industries(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
) -> List[IndustryInfo]:
    """
    Listet alle verfügbaren Industries auf.
    Liest YAML-Dateien aus dem INDUSTRY_CONFIG_DIR.
    """
    config_dir = Path(settings.INDUSTRY_CONFIG_DIR)

    if not config_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Industry config directory not found: {settings.INDUSTRY_CONFIG_DIR}"
        )

    industries = []

    # Alle YAML-Dateien im Verzeichnis durchgehen
    for yaml_file in config_dir.glob("*.yaml"):
        industry_id = yaml_file.stem

        try:
            config = load_industry_config(industry_id, str(config_dir))

            # Statistiken aus DB holen
            total_companies = (
                db.query(func.count(Company.id))
                .filter(Company.industry_id == industry_id)
                .scalar()
            )

            # Durchschnittlichen Score berechnen (nur completed Scans)
            avg_score_result = (
                db.query(func.avg(Scan.overall_score))
                .join(Company)
                .filter(Company.industry_id == industry_id)
                .filter(Scan.status == "completed")
                .filter(Scan.overall_score.isnot(None))
                .scalar()
            )

            avg_score = float(avg_score_result) if avg_score_result else None

            industries.append(
                IndustryInfo(
                    id=industry_id,
                    name=config.get("name", industry_id),
                    display_name=config.get("display_name", industry_id),
                    description=config.get("description", ""),
                    total_companies=total_companies,
                    avg_score=avg_score
                )
            )
        except Exception as e:
            # Fehlerhafte Configs überspringen
            print(f"Error loading industry config {industry_id}: {e}")
            continue

    return industries


@router.get("/{industry_id}", response_model=IndustryInfo)
def get_industry(
    industry_id: str,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
) -> IndustryInfo:
    """
    Holt Details einer einzelnen Industry.
    """
    try:
        config = load_industry_config(industry_id, settings.INDUSTRY_CONFIG_DIR)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Industry '{industry_id}' not found"
        )

    # Statistiken aus DB holen
    total_companies = (
        db.query(func.count(Company.id))
        .filter(Company.industry_id == industry_id)
        .scalar()
    )

    # Durchschnittlichen Score berechnen (nur completed Scans)
    avg_score_result = (
        db.query(func.avg(Scan.overall_score))
        .join(Company)
        .filter(Company.industry_id == industry_id)
        .filter(Scan.status == "completed")
        .filter(Scan.overall_score.isnot(None))
        .scalar()
    )

    avg_score = float(avg_score_result) if avg_score_result else None

    return IndustryInfo(
        id=industry_id,
        name=config.get("name", industry_id),
        display_name=config.get("display_name", industry_id),
        description=config.get("description", ""),
        total_companies=total_companies,
        avg_score=avg_score
    )
