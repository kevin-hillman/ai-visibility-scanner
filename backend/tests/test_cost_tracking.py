"""Integration tests for cost tracking."""
import pytest
from datetime import datetime, timezone
from app.models import ApiCallCost, CostBudget, Scan, Company
from app.services.cost_calculator import CostCalculator


class TestCostModels:
    """Test that cost models can be created and queried."""

    def test_create_api_call_cost(self, test_db):
        company = Company(domain="test.de", name="TestCo", industry_id="test")
        test_db.add(company)
        test_db.flush()

        scan = Scan(company_id=company.id, industry_id="test", status="completed")
        test_db.add(scan)
        test_db.flush()

        cost = ApiCallCost(
            scan_id=scan.id,
            platform="chatgpt",
            model="gpt-4o",
            query="Test query",
            input_tokens=500,
            output_tokens=300,
            total_tokens=800,
            cost_usd=0.004250,
            latency_ms=1200,
            success=True,
        )
        test_db.add(cost)
        test_db.commit()

        saved = test_db.query(ApiCallCost).first()
        assert saved is not None
        assert saved.platform == "chatgpt"
        assert saved.total_tokens == 800
        assert saved.cost_usd == pytest.approx(0.004250)

    def test_create_cost_budget(self, test_db):
        budget = CostBudget(
            month="2026-02",
            budget_usd=50.00,
            warning_threshold=0.8,
        )
        test_db.add(budget)
        test_db.commit()

        saved = test_db.query(CostBudget).first()
        assert saved.month == "2026-02"
        assert saved.budget_usd == 50.00

    def test_scan_cost_fields(self, test_db):
        company = Company(domain="test2.de", name="TestCo2", industry_id="test")
        test_db.add(company)
        test_db.flush()

        scan = Scan(
            company_id=company.id,
            industry_id="test",
            status="completed",
            total_cost_usd=0.0125,
            total_tokens_used=5000,
        )
        test_db.add(scan)
        test_db.commit()

        saved = test_db.query(Scan).first()
        assert saved.total_cost_usd == pytest.approx(0.0125)
        assert saved.total_tokens_used == 5000

    def test_scan_api_costs_relationship(self, test_db):
        company = Company(domain="test3.de", name="TestCo3", industry_id="test")
        test_db.add(company)
        test_db.flush()

        scan = Scan(company_id=company.id, industry_id="test", status="completed")
        test_db.add(scan)
        test_db.flush()

        for i in range(3):
            cost = ApiCallCost(
                scan_id=scan.id,
                platform="chatgpt",
                model="gpt-4o",
                query=f"Query {i}",
                input_tokens=100,
                output_tokens=50,
                total_tokens=150,
                cost_usd=0.001,
                latency_ms=500,
                success=True,
            )
            test_db.add(cost)
        test_db.commit()

        assert len(scan.api_costs) == 3


class TestCostApiEndpoints:
    """Test cost API endpoints."""

    def test_get_summary_empty(self, client):
        response = client.get("/api/v1/costs/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["total_cost_usd"] == 0.0
        assert data["total_calls"] == 0

    def test_get_budget_empty(self, client):
        response = client.get("/api/v1/costs/budget")
        assert response.status_code == 200
        data = response.json()
        assert data["budget_usd"] == 0.0

    def test_set_and_get_budget(self, client):
        response = client.put(
            "/api/v1/costs/budget",
            json={"budget_usd": 50.0, "warning_threshold": 0.8},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["budget_usd"] == 50.0
        assert data["warning_threshold"] == 0.8

    def test_get_platform_costs_empty(self, client):
        response = client.get("/api/v1/costs/by-platform")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_scan_costs_not_found(self, client):
        response = client.get("/api/v1/costs/by-scan/nonexistent")
        assert response.status_code == 404
