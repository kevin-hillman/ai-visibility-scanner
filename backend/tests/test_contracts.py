from datetime import datetime, timezone
from uuid import uuid4

from app.models import Scan
from app.api.contract_utils import REQUIRED_PLATFORMS


def test_ranking_entries_include_scan_id_and_stable_platform_scores(client, test_db):
    # Create company via API
    company_data = {
        "name": "ContractTest GmbH",
        "domain": f"contract-{uuid4().hex[:10]}.de",
        "industry_id": "cybersecurity",
    }
    resp = client.post("/api/v1/companies", json=company_data)
    assert resp.status_code == 201
    company_id = resp.json()["id"]

    # Seed a completed scan directly (no network calls).
    scan_id = f"scan-{uuid4()}"
    scan = Scan(
        id=scan_id,
        company_id=company_id,
        industry_id="cybersecurity",
        status="completed",
        overall_score=55.0,
        platform_scores={"chatgpt": 60.0, "claude": 50.0, "gemini": 55.0},
        query_results=[],
        analysis={},
        recommendations=[],
        report_html=None,
        error_message=None,
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
    )
    test_db.add(scan)
    test_db.commit()

    r = client.get("/api/v1/rankings/cybersecurity")
    assert r.status_code == 200
    data = r.json()

    assert data["entries"], "Expected at least one ranking entry"
    entry = data["entries"][0]
    assert entry["scan_id"] == scan_id

    platform_scores = entry["platform_scores"]
    for platform in REQUIRED_PLATFORMS:
        assert platform in platform_scores


def test_report_exposes_competitors_contract(client, test_db):
    company_data = {
        "name": "CompetitorTest GmbH",
        "domain": f"competitor-{uuid4().hex[:10]}.de",
        "industry_id": "cybersecurity",
    }
    resp = client.post("/api/v1/companies", json=company_data)
    assert resp.status_code == 201
    company_id = resp.json()["id"]

    scan_id = f"scan-{uuid4()}"
    analysis = {
        "top_competitors": [
            {"name": "CrowdStrike", "mentions": 7},
            {"name": "SentinelOne", "mentions": 3},
        ]
    }
    scan = Scan(
        id=scan_id,
        company_id=company_id,
        industry_id="cybersecurity",
        status="completed",
        overall_score=70.0,
        platform_scores={"chatgpt": 80.0},
        query_results=[],
        analysis=analysis,
        recommendations=[],
        report_html="<html></html>",
        error_message=None,
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
    )
    test_db.add(scan)
    test_db.commit()

    r = client.get(f"/api/v1/reports/{scan_id}")
    assert r.status_code == 200
    data = r.json()

    assert "scan" in data
    scan_json = data["scan"]

    # Stable competitor list exposed at scan.competitors (UI contract)
    assert scan_json["competitors"] == analysis["top_competitors"]

    # Stable platform score keys
    for platform in REQUIRED_PLATFORMS:
        assert platform in scan_json["platform_scores"]


def test_scan_endpoint_exposes_competitors_contract(client, test_db):
    company_data = {
        "name": "ScanContract GmbH",
        "domain": f"scan-contract-{uuid4().hex[:10]}.de",
        "industry_id": "cybersecurity",
    }
    resp = client.post("/api/v1/companies", json=company_data)
    assert resp.status_code == 201
    company_id = resp.json()["id"]

    scan_id = f"scan-{uuid4()}"
    analysis = {"top_competitors": [{"name": "Fortinet", "mentions": 2}]}
    scan = Scan(
        id=scan_id,
        company_id=company_id,
        industry_id="cybersecurity",
        status="completed",
        overall_score=42.0,
        platform_scores={"claude": 42.0},
        query_results=[],
        analysis=analysis,
        recommendations=[],
        report_html=None,
        error_message=None,
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
    )
    test_db.add(scan)
    test_db.commit()

    r = client.get(f"/api/v1/scans/{scan_id}")
    assert r.status_code == 200
    data = r.json()

    assert data["competitors"] == analysis["top_competitors"]
