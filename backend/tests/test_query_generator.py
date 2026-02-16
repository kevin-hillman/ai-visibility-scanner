import pytest
from app.services.query_generator import QueryGenerator


def test_generate_queries_returns_correct_count(sample_industry_config, sample_company):
    """Prüft ob ~total queries generiert werden"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
        company_description=sample_company["description"],
        company_location=sample_company["location"],
    )

    expected_total = sample_industry_config["queries"]["total"]
    # Toleriere kleine Abweichungen
    assert len(queries) >= expected_total - 2
    assert len(queries) <= expected_total + 2


def test_generate_queries_has_all_categories(sample_industry_config, sample_company):
    """Prüft ob alle Kategorien vertreten sind"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
    )

    categories = {q["category"] for q in queries}
    expected_categories = set(sample_industry_config["queries"]["categories"].keys())

    assert categories == expected_categories


def test_brand_queries_contain_company_name(sample_industry_config, sample_company):
    """Brand-Queries MÜSSEN den Firmennamen enthalten"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
    )

    brand_queries = [q for q in queries if q["category"] == "brand"]

    for query in brand_queries:
        assert sample_company["name"] in query["query"], \
            f"Brand query '{query['query']}' muss Firmennamen '{sample_company['name']}' enthalten"


def test_no_duplicate_queries(sample_industry_config, sample_company):
    """Keine Duplikate"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
    )

    query_texts = [q["query"] for q in queries]
    unique_queries = set(query_texts)

    assert len(query_texts) == len(unique_queries), \
        "Es wurden doppelte Queries generiert"


def test_queries_have_required_fields(sample_industry_config, sample_company):
    """Jede Query hat query, category, intent"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
    )

    required_fields = {"query", "category", "intent"}

    for query in queries:
        assert all(field in query for field in required_fields), \
            f"Query {query} fehlen Pflichtfelder"
        assert isinstance(query["query"], str) and len(query["query"]) > 0
        assert isinstance(query["category"], str) and len(query["category"]) > 0
        assert isinstance(query["intent"], str) and len(query["intent"]) > 0


def test_generate_queries_with_minimal_company_info(sample_industry_config):
    """Funktioniert auch ohne description/location"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name="MinimalCo",
        company_domain="minimal.com",
    )

    # Sollte trotzdem Queries generieren
    assert len(queries) > 0

    # Brand-Queries sollten weiterhin funktionieren
    brand_queries = [q for q in queries if q["category"] == "brand"]
    assert len(brand_queries) > 0

    for query in brand_queries:
        assert "MinimalCo" in query["query"]
