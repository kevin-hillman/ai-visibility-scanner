import pytest
from app.services.analyzer import Analyzer


@pytest.fixture
def analyzer():
    """Analyzer Instanz"""
    return Analyzer()


def test_analyze_response_company_mentioned(analyzer, sample_company):
    """Erkennt Firmenname in Antwort"""
    response_text = f"Ich empfehle {sample_company['name']} für Ihre IT-Sicherheit."

    result = analyzer.analyze_response(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        query="Beste IT-Sicherheitsfirma?",
        platform="chatgpt",
        response_text=response_text,
    )

    assert result["mentioned"] is True
    assert result["mention_count"] > 0


def test_analyze_response_company_not_mentioned(analyzer, sample_company):
    """Erkennt wenn nicht erwähnt"""
    response_text = "Ich empfehle CrowdStrike oder SentinelOne für Ihre IT-Sicherheit."

    result = analyzer.analyze_response(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        query="Beste IT-Sicherheitsfirma?",
        platform="chatgpt",
        response_text=response_text,
    )

    assert result["mentioned"] is False
    assert result["mention_type"] == "not_mentioned"
    assert result["mention_count"] == 0


def test_analyze_response_domain_mentioned(analyzer, sample_company):
    """Erkennt Domain"""
    response_text = f"Besuchen Sie {sample_company['domain']} für mehr Informationen."

    result = analyzer.analyze_response(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        query="Wo finde ich IT-Sicherheit?",
        platform="chatgpt",
        response_text=response_text,
    )

    assert result["mentioned"] is True


def test_mention_type_direct_recommendation(analyzer, sample_company):
    """'Ich empfehle SecureIT' → direct_recommendation"""
    response_text = f"Ich empfehle {sample_company['name']} für Ihre Anforderungen."

    result = analyzer.analyze_response(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        query="Welche Firma soll ich wählen?",
        platform="chatgpt",
        response_text=response_text,
    )

    assert result["mention_type"] == "direct_recommendation"


def test_mention_type_listed_among_top(analyzer, sample_company):
    """'1. SecureIT 2. OtherCo' → listed_among_top or direct_recommendation, position=1"""
    response_text = f"""Relevante Anbieter in diesem Bereich:
1. {sample_company['name']}
2. CrowdStrike
3. SentinelOne
"""

    result = analyzer.analyze_response(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        query="IT-Sicherheitsfirmen?",
        platform="chatgpt",
        response_text=response_text,
    )

    assert result["mention_type"] in ["listed_among_top", "direct_recommendation"]
    assert result["position"] == 1


def test_mention_type_mentioned_neutrally(analyzer, sample_company):
    """Neutrale Erwähnung"""
    response_text = f"{sample_company['name']} ist ein Unternehmen aus München."

    result = analyzer.analyze_response(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        query="Was ist SecureIT?",
        platform="chatgpt",
        response_text=response_text,
    )

    # Sollte neutral sein, da keine Empfehlung und nicht in Liste
    assert result["mention_type"] in ["mentioned_neutrally", "mentioned_positively"]


def test_competitors_detection(analyzer, sample_company, sample_industry_config):
    """Erkennt genannte Wettbewerber"""
    response_text = f"""Die besten Anbieter sind:
- {sample_company['name']}
- CrowdStrike
- SentinelOne
"""

    # Analyzer braucht competitor_list - simuliere das
    result = analyzer.analyze_response(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        query="Top Anbieter?",
        platform="chatgpt",
        response_text=response_text,
    )

    # Prüfe ob competitors_mentioned existiert und eine Liste ist
    assert "competitors_mentioned" in result
    assert isinstance(result["competitors_mentioned"], list)


def test_context_extraction(analyzer, sample_company):
    """Extrahiert Kontext um die Erwähnung"""
    response_text = f"""Es gibt viele gute Anbieter.
    {sample_company['name']} bietet exzellente Services.
    Auch CrowdStrike ist empfehlenswert."""

    result = analyzer.analyze_response(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        query="Gute Anbieter?",
        platform="chatgpt",
        response_text=response_text,
    )

    assert result["mentioned"] is True
    assert "context" in result
    assert isinstance(result["context"], str)
    # Context sollte die Erwähnung enthalten
    assert sample_company["name"] in result["context"]


def test_aggregate_analysis(analyzer, sample_company):
    """Aggregiert mehrere Ergebnisse korrekt"""
    # aggregate_analysis expects flat dicts (direct output from analyze_response)
    all_results = [
        {
            "query": "Query 1",
            "platform": "chatgpt",
            "category": "brand",
            "mentioned": True,
            "mention_type": "direct_recommendation",
            "mention_count": 1,
            "position": None,
            "sentiment": "positive",
            "competitors_mentioned": ["CrowdStrike"],
        },
        {
            "query": "Query 2",
            "platform": "claude",
            "category": "service",
            "mentioned": False,
            "mention_type": "not_mentioned",
            "mention_count": 0,
            "position": None,
            "sentiment": "neutral",
            "competitors_mentioned": [],
        },
        {
            "query": "Query 3",
            "platform": "gemini",
            "category": "comparison",
            "mentioned": True,
            "mention_type": "listed_among_top",
            "mention_count": 1,
            "position": 2,
            "sentiment": "positive",
            "competitors_mentioned": ["SentinelOne"],
        },
    ]

    aggregated = analyzer.aggregate_analysis(
        company_name=sample_company["name"],
        all_results=all_results,
    )

    assert aggregated["total_queries"] == 3
    assert aggregated["total_mentions"] == 2
    assert aggregated["mention_rate"] == pytest.approx(2/3 * 100, abs=1)

    # Sentiment distribution
    assert aggregated["sentiment_distribution"]["positive"] == 2

    # Top competitors
    assert len(aggregated["top_competitors"]) >= 1
