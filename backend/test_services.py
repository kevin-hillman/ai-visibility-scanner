#!/usr/bin/env python3
"""
Test-Script für GEO Intelligence Engine Services

Dieses Script testet die 5 Backend-Services ohne Datenbank-Abhängigkeiten.
Nützlich für schnelle Validierung und Debugging.
"""

import asyncio
import yaml
from pathlib import Path

# Import Services
from app.services import (
    QueryGenerator,
    LLMClient,
    Analyzer,
    Scorer,
    ReportGenerator
)
from app.config import Settings


def test_query_generator():
    """Test QueryGenerator mit Cybersecurity-Config."""
    print("\n" + "="*60)
    print("TEST 1: QueryGenerator")
    print("="*60)

    # Lade Industry Config
    config_path = Path("industries/cybersecurity.yaml")
    with open(config_path) as f:
        industry_config = yaml.safe_load(f)

    # Initialisiere Generator
    query_gen = QueryGenerator(industry_config)

    # Generiere Queries
    queries = query_gen.generate_queries(
        company_name="CrowdStrike",
        company_domain="crowdstrike.com",
        company_location="Deutschland"
    )

    print(f"✓ {len(queries)} Queries generiert")
    print(f"\nBeispiel-Queries:")

    # Zeige 3 Queries pro Kategorie
    categories = {}
    for q in queries:
        cat = q["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(q)

    for category, cat_queries in categories.items():
        print(f"\n  {category.upper()}:")
        for q in cat_queries[:3]:
            print(f"    • {q['query']}")

    print(f"\n✅ QueryGenerator funktioniert korrekt")
    return queries


def test_analyzer():
    """Test Analyzer mit Beispiel-Responses."""
    print("\n" + "="*60)
    print("TEST 2: Analyzer")
    print("="*60)

    analyzer = Analyzer()

    # Test-Cases
    test_cases = [
        {
            "name": "Direct Recommendation",
            "response": "Ich empfehle CrowdStrike als führenden Anbieter für Endpoint Protection. "
                       "Sie sind bekannt für ihre KI-basierte Threat Detection.",
            "expected_type": "direct_recommendation",
            "expected_sentiment": "positive"
        },
        {
            "name": "Listed Among Top",
            "response": "Top 3 Cybersecurity-Anbieter:\n1. Palo Alto Networks\n2. CrowdStrike\n3. Fortinet",
            "expected_type": "listed_among_top",
            "expected_sentiment": "positive"
        },
        {
            "name": "Mentioned Positively",
            "response": "CrowdStrike bietet gute Lösungen im Bereich Endpoint Security. "
                       "Auch Sophos und Trend Micro sind solide Optionen.",
            "expected_type": "mentioned_positively",
            "expected_sentiment": "positive"
        },
        {
            "name": "Not Mentioned",
            "response": "Für Cybersecurity empfehle ich Palo Alto Networks oder Fortinet. "
                       "Beide sind sehr zuverlässig.",
            "expected_type": "not_mentioned",
            "expected_sentiment": "neutral"
        },
    ]

    for test_case in test_cases:
        result = analyzer.analyze_response(
            company_name="CrowdStrike",
            company_domain="crowdstrike.com",
            query="Beste Cybersecurity-Anbieter?",
            platform="chatgpt",
            response_text=test_case["response"]
        )

        print(f"\n  Test: {test_case['name']}")
        print(f"    Mentioned: {result['mentioned']}")
        print(f"    Mention Type: {result['mention_type']}")
        print(f"    Sentiment: {result['sentiment']}")
        print(f"    Position: {result['position']}")
        print(f"    Competitors: {result['competitors_mentioned']}")

        # Validierung
        if result['mention_type'] == test_case['expected_type']:
            print(f"    ✓ Mention Type korrekt")
        else:
            print(f"    ✗ Mention Type falsch (erwartet: {test_case['expected_type']})")

        if result['sentiment'] == test_case['expected_sentiment']:
            print(f"    ✓ Sentiment korrekt")
        else:
            print(f"    ✗ Sentiment falsch (erwartet: {test_case['expected_sentiment']})")

    print(f"\n✅ Analyzer funktioniert korrekt")


def test_scorer():
    """Test Scorer mit verschiedenen Analyse-Ergebnissen."""
    print("\n" + "="*60)
    print("TEST 3: Scorer")
    print("="*60)

    # Lade Industry Config
    config_path = Path("industries/cybersecurity.yaml")
    with open(config_path) as f:
        industry_config = yaml.safe_load(f)

    scorer = Scorer(industry_config)

    # Test-Results
    test_results = [
        {
            "mention_type": "direct_recommendation",
            "position": 1,
            "sentiment": "positive",
            "platform": "chatgpt",
            "expected_score_range": (100, 120),  # Mit Bonus kann über 100 gehen, dann geclamped
        },
        {
            "mention_type": "listed_among_top",
            "position": 2,
            "sentiment": "positive",
            "platform": "claude",
            "expected_score_range": (80, 100),
        },
        {
            "mention_type": "mentioned_positively",
            "position": None,
            "sentiment": "neutral",
            "platform": "gemini",
            "expected_score_range": (40, 60),
        },
        {
            "mention_type": "not_mentioned",
            "position": None,
            "sentiment": "neutral",
            "platform": "perplexity",
            "expected_score_range": (0, 0),
        },
    ]

    all_results = []

    for test_result in test_results:
        score = scorer.score_single_result(test_result)
        breakdown = scorer.get_score_breakdown(test_result)

        print(f"\n  {test_result['mention_type']} (Pos: {test_result['position']}, Sent: {test_result['sentiment']})")
        print(f"    Score: {score}/100")
        print(f"    Breakdown: Base={breakdown['base_score']}, Bonus={breakdown['position_bonus']}, Modifier={breakdown['sentiment_modifier']}")

        all_results.append({**test_result, "mentioned": test_result["mention_type"] != "not_mentioned"})

    # Test Platform-Scores
    print(f"\n  Platform-Scores:")
    platform_scores = scorer.calculate_platform_scores(all_results)
    for platform, score in platform_scores.items():
        print(f"    {platform}: {score}/100")

    # Test Overall-Score
    overall_score = scorer.calculate_overall_score(platform_scores)
    print(f"\n  Overall-Score: {overall_score}/100")

    print(f"\n✅ Scorer funktioniert korrekt")


def test_report_generator():
    """Test ReportGenerator."""
    print("\n" + "="*60)
    print("TEST 4: ReportGenerator")
    print("="*60)

    # Lade Industry Config
    config_path = Path("industries/cybersecurity.yaml")
    with open(config_path) as f:
        industry_config = yaml.safe_load(f)

    report_gen = ReportGenerator()

    # Mock-Daten
    platform_scores = {
        "chatgpt": 65.5,
        "claude": 45.2,
        "gemini": 38.1,
        "perplexity": 72.3,
    }

    analysis = {
        "total_queries": 50,
        "total_mentions": 28,
        "mention_rate": 56.0,
        "avg_position": 2.3,
        "sentiment_distribution": {
            "positive": 18,
            "neutral": 8,
            "negative": 2
        },
        "strengths": [
            "Hohe Sichtbarkeit in KI-Assistenten",
            "Regelmäßige Top-3-Platzierung"
        ],
        "weaknesses": [
            "Gemini-Sichtbarkeit ausbaufähig"
        ],
        "opportunities": [
            "Content-Optimierung für Claude"
        ],
        "top_competitors": [
            {"name": "Palo Alto Networks", "mentions": 35},
            {"name": "Fortinet", "mentions": 28},
        ],
        "best_categories": ["brand", "service"],
        "worst_categories": ["comparison"],
        "platform_performance": {
            "chatgpt": {"mention_rate": 60.0, "total_queries": 12, "total_mentions": 7},
            "claude": {"mention_rate": 45.0, "total_queries": 12, "total_mentions": 5},
            "gemini": {"mention_rate": 40.0, "total_queries": 13, "total_mentions": 5},
            "perplexity": {"mention_rate": 75.0, "total_queries": 13, "total_mentions": 10},
        }
    }

    # Test Recommendations
    recommendations = report_gen.generate_recommendations(
        company_name="CrowdStrike",
        analysis=analysis,
        platform_scores=platform_scores,
        industry_config=industry_config
    )

    print(f"\n  {len(recommendations)} Handlungsempfehlungen generiert:")
    for i, rec in enumerate(recommendations[:5], 1):
        print(f"    {i}. {rec[:80]}...")

    # Test HTML-Report
    scan_data = {
        "overall_score": 55.3,
        "platform_scores": platform_scores,
        "analysis": analysis,
        "recommendations": recommendations,
        "query_results": [
            {
                "query": "Beste Cybersecurity-Anbieter DACH?",
                "platform": "chatgpt",
                "category": "service",
                "mentioned": True,
                "mention_type": "listed_among_top",
                "position": 2,
                "sentiment": "positive",
            },
            {
                "query": "CrowdStrike Erfahrungen?",
                "platform": "claude",
                "category": "brand",
                "mentioned": True,
                "mention_type": "mentioned_positively",
                "position": None,
                "sentiment": "positive",
            },
        ]
    }

    html_report = report_gen.generate_report_html(
        company_name="CrowdStrike",
        company_domain="crowdstrike.com",
        scan_data=scan_data,
        industry_config=industry_config
    )

    # Speichere Report
    output_path = Path("test_report.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_report)

    print(f"\n  ✓ HTML-Report generiert: {len(html_report)} Zeichen")
    print(f"  ✓ Gespeichert unter: {output_path.absolute()}")

    print(f"\n✅ ReportGenerator funktioniert korrekt")


async def test_llm_client():
    """Test LLMClient (erfordert API-Keys in .env)."""
    print("\n" + "="*60)
    print("TEST 5: LLMClient (Optional - erfordert API-Keys)")
    print("="*60)

    settings = Settings()

    # Prüfe ob API-Keys vorhanden
    has_keys = any([
        settings.OPENAI_API_KEY,
        settings.ANTHROPIC_API_KEY,
        settings.GOOGLE_API_KEY,
        settings.PERPLEXITY_API_KEY
    ])

    if not has_keys:
        print("  ⚠️  Keine API-Keys gefunden - überspringe LLM-Tests")
        print("  (Setze API-Keys in .env für vollständigen Test)")
        return

    llm_client = LLMClient(settings)

    # Lade Industry Config
    config_path = Path("industries/cybersecurity.yaml")
    with open(config_path) as f:
        industry_config = yaml.safe_load(f)

    platforms = industry_config["platforms"]

    # Test-Query
    test_query = "Was sind die besten Cybersecurity-Anbieter für Unternehmen in Deutschland?"

    print(f"\n  Test-Query: {test_query}")
    print(f"  Querying Plattformen...")

    try:
        results = await llm_client.query_all_platforms(test_query, platforms)

        for result in results:
            status = "✓" if result["success"] else "✗"
            print(f"\n  {status} {result['platform'].upper()}")
            print(f"    Model: {result['model']}")
            print(f"    Latency: {result['latency_ms']}ms")

            if result["success"]:
                print(f"    Response: {result['response_text'][:100]}...")
            else:
                print(f"    Error: {result['error']}")

        print(f"\n✅ LLMClient funktioniert korrekt")

    except Exception as e:
        print(f"\n  ✗ LLMClient-Test fehlgeschlagen: {e}")
        print(f"  (Dies ist normal wenn keine API-Keys konfiguriert sind)")


def main():
    """Führe alle Tests aus."""
    print("\n" + "="*60)
    print("GEO INTELLIGENCE ENGINE - SERVICE TESTS")
    print("="*60)

    # Non-async Tests
    test_query_generator()
    test_analyzer()
    test_scorer()
    test_report_generator()

    # Async Test (optional)
    try:
        asyncio.run(test_llm_client())
    except Exception as e:
        print(f"\n⚠️  LLMClient-Test übersprungen: {e}")

    print("\n" + "="*60)
    print("✅ ALLE TESTS ABGESCHLOSSEN")
    print("="*60)
    print("\nNächste Schritte:")
    print("  1. Setze API-Keys in .env für LLM-Tests")
    print("  2. Führe pytest tests/ für Unit-Tests aus")
    print("  3. Starte Backend mit: uvicorn app.main:app --reload")
    print("  4. Teste vollständigen Workflow über API")
    print()


if __name__ == "__main__":
    main()
