"""
Scan Worker.
Orchestriert den kompletten Scan-Workflow für eine Company.
"""
from datetime import datetime
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.models import Scan, Company
from app.config import Settings
from app.services.query_generator import QueryGenerator
from app.services.llm_client import LLMClient
from app.services.analyzer import Analyzer
from app.services.scorer import Scorer
from app.services.report_generator import ReportGenerator
from app.api.industries import load_industry_config


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

        # 5. LLMs abfragen
        llm_client = LLMClient(settings)
        all_results: List[Dict[str, Any]] = []

        # Platform-Konfiguration aus Industry Config
        platforms_config = industry_config.get("platforms", {})

        for query_obj in queries:
            query_text = query_obj.get("query", "")
            query_type = query_obj.get("type", "general")

            # Alle Plattformen für diese Query abfragen
            platform_responses = llm_client.query_all_platforms(
                query=query_text,
                platforms=platforms_config
            )

            # 6. Jede Response analysieren
            analyzer = Analyzer()
            for platform_response in platform_responses:
                platform = platform_response.get("platform", "unknown")
                response_text = platform_response.get("response", "")
                model_used = platform_response.get("model", "unknown")

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
                    "query_type": query_type,
                    "platform": platform,
                    "model": model_used,
                    "response": response_text,
                    "analysis": analysis_result
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
