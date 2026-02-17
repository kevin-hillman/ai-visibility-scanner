"""
Scan Worker.
Orchestriert den kompletten Scan-Workflow für eine Company.
"""
import logging
from datetime import datetime
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.models import Scan, Company, ApiCallCost, CostBudget
from app.config import Settings
from app.services.query_generator import QueryGenerator
from app.services.llm_client import LLMClient
from app.services.analyzer import Analyzer
from app.services.scorer import Scorer
from app.services.report_generator import ReportGenerator
from app.services.cost_calculator import CostCalculator
from app.api.industries import load_industry_config

logger = logging.getLogger(__name__)


async def run_scan(scan_id: str, db: Session, settings: Settings) -> None:
    """
    Führt den kompletten Scan-Workflow für eine Company aus.

    Workflow:
    1. Scan aus DB laden, status → "running"
    2. Company laden
    3. Industry Config laden (YAML)
    4. QueryGenerator: Queries generieren
    5. LLMClient: Für jede Query alle Plattformen abfragen
    6. Analyzer: Jede Response analysieren
    7. Scorer: Scores berechnen
    8. ReportGenerator: Recommendations + HTML generieren
    9. Scan updaten: query_results, platform_scores, overall_score, analysis, recommendations, report_html
    10. status → "completed" (oder "failed" bei Error)

    Args:
        scan_id: ID des Scans
        db: SQLAlchemy Session
        settings: App Settings
    """
    # 1. Scan laden und auf "running" setzen
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise ValueError(f"Scan with id '{scan_id}' not found")

    scan.status = "running"
    scan.started_at = datetime.utcnow()
    db.commit()

    try:
        # 2. Company laden
        company = db.query(Company).filter(Company.id == scan.company_id).first()
        if not company:
            raise ValueError(f"Company with id '{scan.company_id}' not found")

        # 3. Industry Config laden
        industry_config = load_industry_config(scan.industry_id, settings.INDUSTRY_CONFIG_DIR)

        # 4. Queries generieren
        query_generator = QueryGenerator(industry_config)
        queries = query_generator.generate_queries(
            company_name=company.name,
            company_domain=company.domain,
            company_description=company.description,
            company_location=company.location
        )

        # Query-Version auf Scan setzen
        scan.query_version = query_generator.query_version

        # 5. LLMs abfragen
        llm_client = LLMClient(settings)
        cost_calculator = CostCalculator()
        all_results: List[Dict[str, Any]] = []
        known_competitors = industry_config.get("known_competitors", [])
        analyzer = Analyzer(known_competitors=known_competitors)

        # Platform-Konfiguration aus Industry Config
        platforms_config = industry_config.get("platforms", {})

        for query_obj in queries:
            query_text = query_obj.get("query", "")
            category = query_obj.get("category", "general")
            intent = query_obj.get("intent", "")

            # Alle Plattformen für diese Query abfragen
            platform_responses = await llm_client.query_all_platforms(
                query=query_text,
                platforms=platforms_config
            )

            # 6. Jede Response analysieren
            for platform_response in platform_responses:
                platform = platform_response.get("platform", "unknown")
                response_text = platform_response.get("response_text", "")
                model_used = platform_response.get("model", "unknown")

                # Kosten erfassen (auch für fehlgeschlagene Calls)
                api_cost = ApiCallCost(
                    scan_id=scan_id,
                    platform=platform,
                    model=model_used,
                    query=query_text,
                    input_tokens=platform_response.get("input_tokens", 0),
                    output_tokens=platform_response.get("output_tokens", 0),
                    total_tokens=platform_response.get("total_tokens", 0),
                    cost_usd=cost_calculator.calculate_cost(
                        model=model_used,
                        input_tokens=platform_response.get("input_tokens", 0),
                        output_tokens=platform_response.get("output_tokens", 0),
                    ),
                    latency_ms=platform_response.get("latency_ms", 0),
                    success=platform_response.get("success", False),
                )
                db.add(api_cost)

                # Skip failed responses for analysis
                if not platform_response.get("success", False):
                    continue

                analysis_result = analyzer.analyze_response(
                    company_name=company.name,
                    company_domain=company.domain,
                    query=query_text,
                    platform=platform,
                    response_text=response_text
                )

                # Ergebnis anreichern
                result = {
                    "query": query_text,
                    "category": category,
                    "intent": intent,
                    "platform": platform,
                    "model": model_used,
                    "response_text": response_text,
                    **analysis_result,
                }

                all_results.append(result)

        # Aggregierte Analyse erstellen
        aggregated_analysis = analyzer.aggregate_analysis(
            company_name=company.name,
            all_results=all_results
        )

        # 7. Scores berechnen
        scorer = Scorer(industry_config)

        # Scores für jede Platform berechnen
        platform_scores = scorer.calculate_platform_scores(all_results)

        # Overall Score berechnen
        overall_score = scorer.calculate_overall_score(platform_scores)

        # UI contract: always expose all known platforms, even if disabled/skipped.
        for p in ("chatgpt", "claude", "gemini", "perplexity"):
            platform_scores.setdefault(p, 0.0)

        # 8. Report generieren
        report_generator = ReportGenerator()

        # Recommendations generieren
        recommendations = report_generator.generate_recommendations(
            company_name=company.name,
            analysis=aggregated_analysis,
            platform_scores=platform_scores,
            industry_config=industry_config
        )

        # HTML Report generieren
        scan_data = {
            "overall_score": overall_score,
            "platform_scores": platform_scores,
            "query_results": all_results,
            "analysis": aggregated_analysis,
            "recommendations": recommendations
        }

        report_html = report_generator.generate_report_html(
            company_name=company.name,
            company_domain=company.domain,
            scan_data=scan_data,
            industry_config=industry_config
        )

        # 9. Scan updaten
        scan.query_results = all_results
        scan.platform_scores = platform_scores
        scan.overall_score = overall_score
        scan.analysis = aggregated_analysis
        scan.recommendations = recommendations
        scan.report_html = report_html

        # Kosten aggregieren (flush damit die api_cost Records in der DB sind)
        db.flush()
        from sqlalchemy import func
        cost_totals = db.query(
            func.sum(ApiCallCost.cost_usd),
            func.sum(ApiCallCost.total_tokens),
        ).filter(ApiCallCost.scan_id == scan_id).first()

        scan.total_cost_usd = cost_totals[0] or 0.0
        scan.total_tokens_used = int(cost_totals[1] or 0)

        # Budget-Warnung prüfen
        _check_budget_warning(db)

        scan.status = "completed"
        scan.completed_at = datetime.utcnow()
        scan.error_message = None

        db.commit()

    except Exception as e:
        # Bei Fehler: Status auf "failed" setzen
        scan.status = "failed"
        scan.error_message = str(e)
        scan.completed_at = datetime.utcnow()
        db.commit()
        raise


def _check_budget_warning(db: Session) -> None:
    """Prüft ob Monatsbudget-Schwelle überschritten ist und loggt Warnung."""
    from sqlalchemy import func

    now = datetime.utcnow()
    current_month = now.strftime("%Y-%m")

    budget = db.query(CostBudget).filter(CostBudget.month == current_month).first()
    if not budget:
        return

    month_total = db.query(func.sum(ApiCallCost.cost_usd)).filter(
        ApiCallCost.created_at >= now.replace(day=1, hour=0, minute=0, second=0)
    ).scalar() or 0.0

    ratio = month_total / budget.budget_usd if budget.budget_usd > 0 else 0
    if ratio >= budget.warning_threshold:
        logger.warning(
            f"BUDGET-WARNUNG: {ratio:.0%} des Monatsbudgets verbraucht "
            f"(${month_total:.4f} / ${budget.budget_usd:.2f})"
        )
