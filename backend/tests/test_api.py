import pytest
from datetime import datetime
from app.models import Company, Lead


def test_create_company(client):
    """POST /companies → 201"""
    company_data = {
        "name": "TestCorp GmbH",
        "domain": "testcorp.de",
        "industry_id": "cybersecurity",
        "description": "Test description",
        "location": "Berlin",
    }

    response = client.post("/api/v1/companies", json=company_data)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == company_data["name"]
    assert data["domain"] == company_data["domain"]
    assert "id" in data


def test_list_companies(client):
    """GET /companies → 200, Liste"""
    # Erst eine Company erstellen
    company_data = {
        "name": "ListTest GmbH",
        "domain": "listtest.de",
        "industry_id": "cybersecurity",
    }
    client.post("/api/v1/companies", json=company_data)

    # Dann listen
    response = client.get("/api/v1/companies")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(c["domain"] == "listtest.de" for c in data)


def test_get_company_not_found(client):
    """GET /companies/nonexistent → 404"""
    response = client.get("/api/v1/companies/nonexistent-id-12345")

    assert response.status_code == 404


def test_create_company_duplicate_domain(client):
    """Doppelte Domain → 400/409"""
    company_data = {
        "name": "Duplicate Corp",
        "domain": "duplicate.de",
        "industry_id": "cybersecurity",
    }

    # Erste Erstellung
    response1 = client.post("/api/v1/companies", json=company_data)
    assert response1.status_code == 201

    # Zweite Erstellung mit gleicher Domain
    response2 = client.post("/api/v1/companies", json=company_data)
    assert response2.status_code in [400, 409]


def test_create_lead(client):
    """POST /leads → 201"""
    lead_data = {
        "name": "Max Mustermann",
        "email": "max@example.com",
        "company_name": "Example GmbH",
        "phone": "+49123456789",
        "industry_id": "cybersecurity",
        "source_page": "landing_page",
        "message": "Ich interessiere mich für einen Scan.",
    }

    response = client.post("/api/v1/leads", json=lead_data)

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "created_at" in data


def test_create_lead_invalid_email(client):
    """Fehlende Pflichtfelder → 422"""
    lead_data = {
        "name": "Max Mustermann",
        # email fehlt!
        "company_name": "Example GmbH",
    }

    response = client.post("/api/v1/leads", json=lead_data)

    assert response.status_code == 422


def test_list_industries(client):
    """GET /industries → 200 (braucht YAML-Datei)"""
    response = client.get("/api/v1/industries")

    # Sollte 200 sein, auch wenn Liste leer ist
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    # Wenn industries/cybersecurity.yaml existiert
    if len(data) > 0:
        assert all("id" in industry for industry in data)
        assert all("name" in industry for industry in data)


def test_get_ranking_empty(client):
    """GET /rankings/cybersecurity → 200, leere entries"""
    response = client.get("/api/v1/rankings/cybersecurity")

    assert response.status_code == 200
    data = response.json()
    assert "industry_id" in data
    assert "entries" in data
    assert isinstance(data["entries"], list)
    # Initial sollte leer sein
    assert len(data["entries"]) == 0


def test_health_check(client):
    """GET /health → 200"""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_get_company_by_id(client):
    """GET /companies/{id} → 200"""
    # Company erstellen
    company_data = {
        "name": "GetByID Corp",
        "domain": "getbyid.de",
        "industry_id": "cybersecurity",
    }
    create_response = client.post("/api/v1/companies", json=company_data)
    company_id = create_response.json()["id"]

    # Abrufen
    response = client.get(f"/api/v1/companies/{company_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == company_id
    assert data["domain"] == "getbyid.de"


def test_delete_company(client):
    """DELETE /companies/{id} → 200/204"""
    # Company erstellen
    company_data = {
        "name": "Delete Corp",
        "domain": "delete.de",
        "industry_id": "cybersecurity",
    }
    create_response = client.post("/api/v1/companies", json=company_data)
    company_id = create_response.json()["id"]

    # Löschen
    delete_response = client.delete(f"/api/v1/companies/{company_id}")
    assert delete_response.status_code in [200, 204]

    # Sollte nicht mehr abrufbar sein
    get_response = client.get(f"/api/v1/companies/{company_id}")
    assert get_response.status_code == 404


def test_create_company_minimal_fields(client):
    """POST /companies nur mit Pflichtfeldern"""
    company_data = {
        "name": "Minimal Corp",
        "domain": "minimal.de",
        "industry_id": "cybersecurity",
    }

    response = client.post("/api/v1/companies", json=company_data)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Minimal Corp"
    assert data["domain"] == "minimal.de"


def test_create_lead_minimal_fields(client):
    """POST /leads nur mit Pflichtfeldern"""
    lead_data = {
        "name": "Minimal Lead",
        "email": "minimal@example.com",
    }

    response = client.post("/api/v1/leads", json=lead_data)

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "created_at" in data


def test_list_companies_empty(client):
    """GET /companies auf leerer DB → leere Liste"""
    # Nutze frische Test-DB (via fixture)
    response = client.get("/api/v1/companies")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
