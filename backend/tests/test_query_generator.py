import pytest
from app.services.query_generator import QueryGenerator


def test_generate_queries_returns_all(sample_industry_config, sample_company):
    """Gibt alle generic + brand Queries zurück"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
    )

    generic_count = len(sample_industry_config["queries"]["generic"])
    brand_count = len(sample_industry_config["queries"]["brand"])
    assert len(queries) == generic_count + brand_count


def test_generic_queries_are_identical_for_all_companies(sample_industry_config):
    """Generic Queries müssen für alle Firmen identisch sein"""
    generator = QueryGenerator(sample_industry_config)

    queries_a = generator.generate_queries(
        company_name="Firma A",
        company_domain="firma-a.de",
    )
    queries_b = generator.generate_queries(
        company_name="Firma B",
        company_domain="firma-b.de",
    )

    generic_a = [q for q in queries_a if q["category"] != "brand"]
    generic_b = [q for q in queries_b if q["category"] != "brand"]

    assert generic_a == generic_b, "Generic Queries müssen für alle Firmen identisch sein"


def test_brand_queries_contain_company_name(sample_industry_config, sample_company):
    """Brand-Queries MÜSSEN den Firmennamen enthalten"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
    )

    brand_queries = [q for q in queries if q["category"] == "brand"]
    assert len(brand_queries) > 0

    for query in brand_queries:
        assert sample_company["name"] in query["query"], \
            f"Brand query '{query['query']}' muss Firmennamen '{sample_company['name']}' enthalten"


def test_brand_queries_differ_per_company(sample_industry_config):
    """Brand Queries müssen sich pro Firma unterscheiden"""
    generator = QueryGenerator(sample_industry_config)

    queries_a = generator.generate_queries(
        company_name="Firma A",
        company_domain="firma-a.de",
    )
    queries_b = generator.generate_queries(
        company_name="Firma B",
        company_domain="firma-b.de",
    )

    brand_a = [q["query"] for q in queries_a if q["category"] == "brand"]
    brand_b = [q["query"] for q in queries_b if q["category"] == "brand"]

    assert brand_a != brand_b, "Brand Queries müssen sich pro Firma unterscheiden"


def test_no_duplicate_queries(sample_industry_config, sample_company):
    """Keine Duplikate"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
    )

    query_texts = [q["query"] for q in queries]
    assert len(query_texts) == len(set(query_texts)), "Doppelte Queries gefunden"


def test_queries_have_required_fields(sample_industry_config, sample_company):
    """Jede Query hat query, category, intent"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
    )

    for query in queries:
        assert "query" in query and isinstance(query["query"], str) and len(query["query"]) > 0
        assert "category" in query and isinstance(query["category"], str) and len(query["category"]) > 0
        assert "intent" in query and isinstance(query["intent"], str) and len(query["intent"]) > 0


def test_query_version(sample_industry_config):
    """Query-Version wird korrekt zurückgegeben"""
    generator = QueryGenerator(sample_industry_config)
    assert generator.query_version == "test-v1"


def test_query_version_unknown_fallback():
    """Fallback bei fehlender Version"""
    generator = QueryGenerator({"queries": {}})
    assert generator.query_version == "unknown"


def test_generate_queries_with_minimal_company_info(sample_industry_config):
    """Funktioniert auch ohne description/location"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name="MinimalCo",
        company_domain="minimal.com",
    )

    assert len(queries) > 0

    brand_queries = [q for q in queries if q["category"] == "brand"]
    assert len(brand_queries) > 0
    for query in brand_queries:
        assert "MinimalCo" in query["query"]


def test_has_all_categories(sample_industry_config, sample_company):
    """Alle erwarteten Kategorien sind vorhanden"""
    generator = QueryGenerator(sample_industry_config)
    queries = generator.generate_queries(
        company_name=sample_company["name"],
        company_domain=sample_company["domain"],
    )

    categories = {q["category"] for q in queries}
    assert "brand" in categories
    assert "service" in categories


def test_empty_config_returns_empty():
    """Leere Config ergibt leere Query-Liste"""
    generator = QueryGenerator({"queries": {}})
    queries = generator.generate_queries(
        company_name="Test",
        company_domain="test.com",
    )
    assert queries == []
