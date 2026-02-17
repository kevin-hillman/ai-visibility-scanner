"""
Cost Tracking API Router.
Endpunkte für Kostenübersicht, Scan-Details, Plattform-Breakdown und Budget-Verwaltung.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import ApiCallCost, CostBudget, Scan, Company
from app.schemas import (
    CostSummary,
    ScanCostDetail,
    ScanCostListEntry,
    PlatformCostBreakdown,
    BudgetResponse,
    BudgetUpdate,
)

router = APIRouter()


@router.get("/scans", response_model=list[ScanCostListEntry])
def get_scan_cost_list(
    month: str = Query(default=None, description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
):
    """Liste aller Scans mit Kostenzusammenfassung."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")

    year, m = month.split("-")
    month_start = datetime(int(year), int(m), 1, tzinfo=timezone.utc)
    if int(m) == 12:
        month_end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(int(year), int(m) + 1, 1, tzinfo=timezone.utc)

    scans = (
        db.query(Scan)
        .join(Company, Scan.company_id == Company.id)
        .filter(Scan.started_at >= month_start, Scan.started_at < month_end)
        .order_by(Scan.started_at.desc())
        .all()
    )

    result = []
    for scan in scans:
        company = db.query(Company).filter(Company.id == scan.company_id).first()

        cost_agg = db.query(
            func.sum(ApiCallCost.cost_usd),
            func.sum(ApiCallCost.total_tokens),
            func.count(ApiCallCost.id),
        ).filter(ApiCallCost.scan_id == scan.id).first()

        platform_rows = db.query(
            ApiCallCost.platform,
            func.sum(ApiCallCost.cost_usd),
        ).filter(ApiCallCost.scan_id == scan.id).group_by(ApiCallCost.platform).all()

        result.append(ScanCostListEntry(
            scan_id=scan.id,
            company_name=company.name if company else "Unbekannt",
            company_domain=company.domain if company else "",
            status=scan.status,
            total_cost_usd=round(cost_agg[0] or 0.0, 6),
            total_tokens=int(cost_agg[1] or 0),
            total_calls=cost_agg[2] or 0,
            platform_breakdown={row[0]: round(row[1], 6) for row in platform_rows},
            started_at=scan.started_at,
            completed_at=scan.completed_at,
            query_version=scan.query_version,
        ))

    return result


@router.get("/summary", response_model=CostSummary)
def get_cost_summary(
    month: str = Query(default=None, description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
):
    """Monatsübersicht der Kosten."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")

    year, m = month.split("-")
    month_start = datetime(int(year), int(m), 1, tzinfo=timezone.utc)
    if int(m) == 12:
        month_end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(int(year), int(m) + 1, 1, tzinfo=timezone.utc)

    totals = db.query(
        func.sum(ApiCallCost.cost_usd),
        func.sum(ApiCallCost.total_tokens),
        func.count(ApiCallCost.id),
    ).filter(
        ApiCallCost.created_at >= month_start,
        ApiCallCost.created_at < month_end,
    ).first()

    total_cost = totals[0] or 0.0
    total_tokens = int(totals[1] or 0)
    total_calls = totals[2] or 0

    scan_count = db.query(func.count(Scan.id)).filter(
        Scan.started_at >= month_start,
        Scan.started_at < month_end,
        Scan.status == "completed",
    ).scalar() or 0

    avg_cost_per_scan = total_cost / scan_count if scan_count > 0 else 0.0

    platform_rows = db.query(
        ApiCallCost.platform,
        func.sum(ApiCallCost.cost_usd),
    ).filter(
        ApiCallCost.created_at >= month_start,
        ApiCallCost.created_at < month_end,
    ).group_by(ApiCallCost.platform).all()

    platform_breakdown = {row[0]: round(row[1], 6) for row in platform_rows}

    daily_rows = db.query(
        func.date(ApiCallCost.created_at),
        func.sum(ApiCallCost.cost_usd),
    ).filter(
        ApiCallCost.created_at >= month_start,
        ApiCallCost.created_at < month_end,
    ).group_by(func.date(ApiCallCost.created_at)).order_by(func.date(ApiCallCost.created_at)).all()

    daily_costs = [{"date": str(row[0]), "cost": round(row[1], 6)} for row in daily_rows]

    return CostSummary(
        month=month,
        total_cost_usd=round(total_cost, 6),
        total_tokens=total_tokens,
        total_calls=total_calls,
        avg_cost_per_scan=round(avg_cost_per_scan, 6),
        platform_breakdown=platform_breakdown,
        daily_costs=daily_costs,
    )


@router.get("/by-scan/{scan_id}", response_model=ScanCostDetail)
def get_scan_costs(scan_id: str, db: Session = Depends(get_db)):
    """Kosten-Details eines einzelnen Scans."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan nicht gefunden")

    company = db.query(Company).filter(Company.id == scan.company_id).first()

    costs = db.query(ApiCallCost).filter(ApiCallCost.scan_id == scan_id).order_by(ApiCallCost.created_at).all()

    total_cost = sum(c.cost_usd for c in costs)
    total_tokens = sum(c.total_tokens for c in costs)

    platform_breakdown: dict[str, float] = {}
    for c in costs:
        platform_breakdown[c.platform] = platform_breakdown.get(c.platform, 0) + c.cost_usd

    return ScanCostDetail(
        scan_id=scan_id,
        company_name=company.name if company else "Unbekannt",
        total_cost_usd=round(total_cost, 6),
        total_tokens=int(total_tokens),
        total_calls=len(costs),
        platform_breakdown={k: round(v, 6) for k, v in platform_breakdown.items()},
        calls=costs,
    )


@router.get("/by-platform", response_model=list[PlatformCostBreakdown])
def get_platform_costs(
    from_date: str = Query(default=None, description="Format: YYYY-MM-DD"),
    to_date: str = Query(default=None, description="Format: YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """Kostenaufschlüsselung nach Plattform."""
    query = db.query(
        ApiCallCost.platform,
        func.sum(ApiCallCost.cost_usd),
        func.sum(ApiCallCost.total_tokens),
        func.count(ApiCallCost.id),
    )

    if from_date:
        query = query.filter(ApiCallCost.created_at >= from_date)
    if to_date:
        query = query.filter(ApiCallCost.created_at <= to_date)

    rows = query.group_by(ApiCallCost.platform).all()

    return [
        PlatformCostBreakdown(
            platform=row[0],
            total_cost_usd=round(row[1], 6),
            total_tokens=int(row[2]),
            total_calls=row[3],
            avg_cost_per_call=round(row[1] / row[3], 6) if row[3] > 0 else 0,
        )
        for row in rows
    ]


@router.get("/budget", response_model=BudgetResponse)
def get_budget(
    month: str = Query(default=None, description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
):
    """Aktuelles Budget und Auslastung."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")

    budget = db.query(CostBudget).filter(CostBudget.month == month).first()

    year, m = month.split("-")
    month_start = datetime(int(year), int(m), 1, tzinfo=timezone.utc)
    if int(m) == 12:
        month_end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(int(year), int(m) + 1, 1, tzinfo=timezone.utc)

    spent = db.query(func.sum(ApiCallCost.cost_usd)).filter(
        ApiCallCost.created_at >= month_start,
        ApiCallCost.created_at < month_end,
    ).scalar() or 0.0

    budget_usd = budget.budget_usd if budget else 0.0
    warning_threshold = budget.warning_threshold if budget else 0.8

    return BudgetResponse(
        month=month,
        budget_usd=budget_usd,
        warning_threshold=warning_threshold,
        spent_usd=round(spent, 6),
        remaining_usd=round(max(0, budget_usd - spent), 6),
        utilization=round(spent / budget_usd, 4) if budget_usd > 0 else 0.0,
    )


@router.put("/budget", response_model=BudgetResponse)
def set_budget(
    data: BudgetUpdate,
    month: str = Query(default=None, description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
):
    """Monatsbudget setzen oder aktualisieren."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")

    budget = db.query(CostBudget).filter(CostBudget.month == month).first()

    if budget:
        budget.budget_usd = data.budget_usd
        budget.warning_threshold = data.warning_threshold
    else:
        budget = CostBudget(
            month=month,
            budget_usd=data.budget_usd,
            warning_threshold=data.warning_threshold,
        )
        db.add(budget)

    db.commit()
    db.refresh(budget)

    return get_budget(month=month, db=db)
