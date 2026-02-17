"""
CLI Tool für Kostenübersicht.

Usage:
    python -m cli.costs summary [--month YYYY-MM]
    python -m cli.costs detail <scan_id>
    python -m cli.costs budget set <amount> [--threshold 0.8]
    python -m cli.costs budget show [--month YYYY-MM]
"""
import sys
from datetime import datetime, timezone

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from sqlalchemy import func

from app.database import SessionLocal
from app.models import ApiCallCost, CostBudget, Scan, Company

console = Console()


def cmd_summary(month: str | None = None):
    """Monatsübersicht der API-Kosten."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")

    db = SessionLocal()
    try:
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

        console.print(Panel(f"[bold]Kostenübersicht {month}[/bold]", style="cyan"))
        console.print(f"  Gesamtkosten:     [bold green]${total_cost:.4f}[/bold green]")
        console.print(f"  API-Calls:        [bold]{total_calls}[/bold]")
        console.print(f"  Tokens gesamt:    [bold]{total_tokens:,}[/bold]")
        console.print(f"  Scans:            [bold]{scan_count}[/bold]")
        if scan_count > 0:
            console.print(f"  Ø pro Scan:       [bold]${total_cost / scan_count:.4f}[/bold]")
        console.print()

        platform_rows = db.query(
            ApiCallCost.platform,
            func.sum(ApiCallCost.cost_usd),
            func.sum(ApiCallCost.total_tokens),
            func.count(ApiCallCost.id),
        ).filter(
            ApiCallCost.created_at >= month_start,
            ApiCallCost.created_at < month_end,
        ).group_by(ApiCallCost.platform).all()

        if platform_rows:
            table = Table(title="Kosten pro Plattform")
            table.add_column("Plattform", style="cyan")
            table.add_column("Kosten", justify="right", style="green")
            table.add_column("Tokens", justify="right")
            table.add_column("Calls", justify="right")

            for row in platform_rows:
                table.add_row(row[0], f"${row[1]:.4f}", f"{int(row[2]):,}", str(row[3]))

            console.print(table)

        budget = db.query(CostBudget).filter(CostBudget.month == month).first()
        if budget:
            ratio = total_cost / budget.budget_usd if budget.budget_usd > 0 else 0
            color = "green" if ratio < budget.warning_threshold else "yellow" if ratio < 1.0 else "red"
            console.print(f"\n  Budget:           ${budget.budget_usd:.2f}")
            console.print(f"  Auslastung:       [{color}]{ratio:.0%}[/{color}]")

    finally:
        db.close()


def cmd_detail(scan_id: str):
    """Kosten-Details eines Scans."""
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            console.print(f"[red]Scan '{scan_id}' nicht gefunden[/red]")
            return

        company = db.query(Company).filter(Company.id == scan.company_id).first()
        costs = db.query(ApiCallCost).filter(ApiCallCost.scan_id == scan_id).order_by(ApiCallCost.created_at).all()

        console.print(Panel(
            f"[bold]{company.name if company else 'Unbekannt'}[/bold] — Scan {scan_id[:8]}...",
            style="cyan"
        ))

        if not costs:
            console.print("  Keine Kostendaten vorhanden")
            return

        table = Table(title=f"API-Calls ({len(costs)} gesamt)")
        table.add_column("Plattform", style="cyan")
        table.add_column("Model")
        table.add_column("Query", max_width=40)
        table.add_column("Tokens", justify="right")
        table.add_column("Kosten", justify="right", style="green")
        table.add_column("ms", justify="right")

        for c in costs:
            table.add_row(
                c.platform,
                c.model,
                c.query[:40] + "..." if len(c.query) > 40 else c.query,
                str(int(c.total_tokens)),
                f"${c.cost_usd:.6f}",
                str(int(c.latency_ms)),
            )

        console.print(table)

        total = sum(c.cost_usd for c in costs)
        console.print(f"\n  [bold]Gesamt: ${total:.4f}[/bold]")

    finally:
        db.close()


def cmd_budget_set(amount: float, threshold: float = 0.8):
    """Monatsbudget setzen."""
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    db = SessionLocal()
    try:
        budget = db.query(CostBudget).filter(CostBudget.month == month).first()
        if budget:
            budget.budget_usd = amount
            budget.warning_threshold = threshold
        else:
            budget = CostBudget(month=month, budget_usd=amount, warning_threshold=threshold)
            db.add(budget)
        db.commit()
        console.print(f"[green]Budget für {month} gesetzt: ${amount:.2f} (Warnung bei {threshold:.0%})[/green]")
    finally:
        db.close()


def cmd_budget_show(month: str | None = None):
    """Budget anzeigen."""
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")
    db = SessionLocal()
    try:
        budget = db.query(CostBudget).filter(CostBudget.month == month).first()
        if not budget:
            console.print(f"[yellow]Kein Budget für {month} definiert[/yellow]")
            return
        console.print(f"  Monat:     {budget.month}")
        console.print(f"  Budget:    ${budget.budget_usd:.2f}")
        console.print(f"  Schwelle:  {budget.warning_threshold:.0%}")
    finally:
        db.close()


def main():
    args = sys.argv[1:]

    if not args or args[0] == "help":
        console.print(__doc__)
        return

    if args[0] == "summary":
        month = args[2] if len(args) > 2 and args[1] == "--month" else None
        cmd_summary(month)
    elif args[0] == "detail" and len(args) > 1:
        cmd_detail(args[1])
    elif args[0] == "budget":
        if len(args) > 1 and args[1] == "set" and len(args) > 2:
            threshold = float(args[4]) if len(args) > 4 and args[3] == "--threshold" else 0.8
            cmd_budget_set(float(args[2]), threshold)
        else:
            month = args[3] if len(args) > 3 and args[2] == "--month" else None
            cmd_budget_show(month)
    else:
        console.print(f"[red]Unbekannter Befehl: {args[0]}[/red]")
        console.print(__doc__)


if __name__ == "__main__":
    main()
