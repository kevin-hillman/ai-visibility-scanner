import pytest
from app.services.report_generator import ReportGenerator


@pytest.fixture
def report_generator():
    """ReportGenerator Instanz"""
    return ReportGenerator()


def test_generate_recommendations_low_score(report_generator, sample_company, sample_industry_config):
    """Niedrige Scores → Verbesserungsempfehlungen"""
    analysis = {
        "total_queries": 50,
        "total_mentions": 5,
        "mention_rate": 0.1,
        "platform_breakdown": {
            "chatgpt": {"mentions": 2, "queries": 15},
            "claude": {"mentions": 1, "queries": 15},
            "gemini": {"mentions": 1, "queries": 10},
            "perplexity": {"mentions": 1, "queries": 10},
        }
    }

    platform_scores = {
        "chatgpt": 15.0,
        "claude": 10.0,
        "gemini": 12.0,
        "perplexity": 8.0,
    }

    recommendations = report_generator.generate_recommendations(
        company_name=sample_company["name"],
        analysis=analysis,
        platform_scores=platform_scores,
        industry_config=sample_industry_config,
    )

    # Bei niedrigen Scores sollten Verbesserungsvorschläge kommen
    assert len(recommendations) > 0

    # Empfehlungen sollten actionable sein
    for rec in recommendations:
        assert isinstance(rec, str)
        assert len(rec) > 10  # Nicht nur leere Strings


def test_generate_recommendations_not_empty(report_generator, sample_company, sample_industry_config):
    """Immer mindestens 3 Empfehlungen"""
    # Selbst bei guten Scores
    analysis = {
        "total_queries": 50,
        "total_mentions": 40,
        "mention_rate": 0.8,
        "platform_breakdown": {
            "chatgpt": {"mentions": 12, "queries": 15},
            "claude": {"mentions": 10, "queries": 15},
        }
    }

    platform_scores = {
        "chatgpt": 85.0,
        "claude": 80.0,
    }

    recommendations = report_generator.generate_recommendations(
        company_name=sample_company["name"],
        analysis=analysis,
        platform_scores=platform_scores,
        industry_config=sample_industry_config,
    )

    assert len(recommendations) >= 3


def test_generate_report_html_contains_company(report_generator, sample_company, sample_industry_config):
    """HTML enthält Firmennamen"""
    scan_data = {
        "id": "scan-123",
        "company_name": sample_company["name"],
        "company_domain": sample_company["domain"],
        "overall_score": 75.5,
        "platform_scores": {
            "chatgpt": 80.0,
            "claude": 70.0,
        },
        "analysis": {
            "total_queries": 50,
            "total_mentions": 30,
            "mention_rate": 0.6,
        },
        "recommendations": [
            "Optimieren Sie Ihre Content-Strategie",
            "Bauen Sie mehr Backlinks auf",
            "Verbessern Sie Ihre Online-Präsenz",
        ],
    }

    html = report_generator.generate_report_html(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        scan_data=scan_data,
        industry_config=sample_industry_config,
    )

    assert sample_company["name"] in html
    assert sample_company["domain"] in html


def test_generate_report_html_contains_scores(report_generator, sample_company, sample_industry_config):
    """HTML enthält Scores"""
    scan_data = {
        "id": "scan-123",
        "company_name": sample_company["name"],
        "company_domain": sample_company["domain"],
        "overall_score": 75.5,
        "platform_scores": {
            "chatgpt": 80.0,
            "claude": 70.0,
        },
        "analysis": {
            "total_queries": 50,
            "total_mentions": 30,
            "mention_rate": 0.6,
        },
        "recommendations": [],
    }

    html = report_generator.generate_report_html(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        scan_data=scan_data,
        industry_config=sample_industry_config,
    )

    # Scores sollten im HTML vorkommen
    assert "75.5" in html
    assert "80.0" in html or "80" in html
    assert "70.0" in html or "70" in html


def test_generate_report_html_valid_structure(report_generator, sample_company, sample_industry_config):
    """HTML hat grundlegende Struktur"""
    scan_data = {
        "id": "scan-123",
        "company_name": sample_company["name"],
        "company_domain": sample_company["domain"],
        "overall_score": 75.5,
        "platform_scores": {
            "chatgpt": 80.0,
        },
        "analysis": {
            "total_queries": 50,
            "total_mentions": 30,
            "mention_rate": 0.6,
        },
        "recommendations": ["Empfehlung 1"],
    }

    html = report_generator.generate_report_html(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        scan_data=scan_data,
        industry_config=sample_industry_config,
    )

    # Basis-HTML-Struktur
    assert "<html" in html.lower()
    assert "</html>" in html.lower()
    assert "<body" in html.lower()
    assert "</body>" in html.lower()

    # Sollte nicht leer sein
    assert len(html) > 100


def test_generate_recommendations_platform_specific(report_generator, sample_company, sample_industry_config):
    """Plattform-spezifische Empfehlungen bei großen Unterschieden"""
    analysis = {
        "total_queries": 50,
        "total_mentions": 20,
        "mention_rate": 0.4,
        "platform_breakdown": {
            "chatgpt": {"mentions": 15, "queries": 15},  # Sehr gut
            "claude": {"mentions": 2, "queries": 15},    # Schlecht
        }
    }

    platform_scores = {
        "chatgpt": 90.0,
        "claude": 20.0,
    }

    recommendations = report_generator.generate_recommendations(
        company_name=sample_company["name"],
        analysis=analysis,
        platform_scores=platform_scores,
        industry_config=sample_industry_config,
    )

    # Sollte auf schwache Plattform hinweisen
    assert len(recommendations) > 0
    recommendations_text = " ".join(recommendations).lower()
    # Könnte "claude" oder "anthropic" oder allgemein "plattform" erwähnen
    assert any(keyword in recommendations_text for keyword in ["claude", "plattform", "ki-system"])
