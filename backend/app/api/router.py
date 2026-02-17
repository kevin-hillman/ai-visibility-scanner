"""
Haupt-Router für die GEO Intelligence Engine API.
Inkludiert alle Sub-Router für Companies, Scans, Rankings, Reports, Leads, Industries und Costs.
"""
from fastapi import APIRouter

from app.api import companies, scans, rankings, reports, leads, industries, costs

router = APIRouter()

# Sub-Router einbinden
router.include_router(
    companies.router,
    prefix="/companies",
    tags=["companies"]
)

router.include_router(
    scans.router,
    prefix="/scans",
    tags=["scans"]
)

router.include_router(
    rankings.router,
    prefix="/rankings",
    tags=["rankings"]
)

router.include_router(
    reports.router,
    prefix="/reports",
    tags=["reports"]
)

router.include_router(
    leads.router,
    prefix="/leads",
    tags=["leads"]
)

router.include_router(
    industries.router,
    prefix="/industries",
    tags=["industries"]
)

router.include_router(
    costs.router,
    prefix="/costs",
    tags=["costs"]
)
