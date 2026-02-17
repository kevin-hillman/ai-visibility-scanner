import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.models import Base
from app.main import app
from app.dependencies import get_db, get_settings
from app.config import Settings


@pytest.fixture
def test_db():
    """In-memory SQLite für Tests"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def test_settings():
    """Test-Settings mit Dummy-Keys"""
    return Settings(
        DATABASE_URL="sqlite:///:memory:",
        OPENAI_API_KEY="test-key",
        ANTHROPIC_API_KEY="test-key",
        GOOGLE_API_KEY="test-key",
        PERPLEXITY_API_KEY="test-key",
        INDUSTRY_CONFIG_DIR="./industries",
    )


@pytest.fixture
def client(test_db):
    """FastAPI TestClient mit Test-DB"""
    def override_get_db():
        yield test_db
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_industry_config():
    """Minimal Industry Config für Tests (Pre-compiled Query Format)"""
    return {
        "id": "test_industry",
        "name": "Test Industry",
        "display_name": "Test Industry Display",
        "description": "Test",
        "language": "de",
        "platforms": {
            "chatgpt": {"weight": 0.5, "model": "gpt-4o"},
            "claude": {"weight": 0.5, "model": "claude-sonnet-4-5-20250929"},
        },
        "scoring": {
            "mention_types": {
                "direct_recommendation": 1.0,
                "listed_among_top": 0.8,
                "mentioned_positively": 0.6,
                "mentioned_neutrally": 0.3,
                "not_mentioned": 0.0,
            }
        },
        "queries": {
            "version": "test-v1",
            "generic": [
                {
                    "query": "Beste Cybersecurity Anbieter in Deutschland",
                    "category": "service",
                    "intent": "Suche nach Lösungsanbietern",
                },
                {
                    "query": "Wie schütze ich mein Unternehmen vor Ransomware?",
                    "category": "problem",
                    "intent": "Problemlösungs-orientierte Suche",
                },
                {
                    "query": "Top 10 IT-Sicherheitsunternehmen im DACH-Raum",
                    "category": "comparison",
                    "intent": "Vergleichs- und Auswahlsuche",
                },
            ],
            "brand": [
                {
                    "query": "{company_name} Erfahrungen und Bewertungen",
                    "category": "brand",
                    "intent": "Direkte Markenbewertung",
                },
                {
                    "query": "Ist {company_name} ein guter Anbieter?",
                    "category": "brand",
                    "intent": "Direkte Markenbewertung",
                },
            ],
        },
        "known_competitors": ["CrowdStrike", "Sophos"],
    }


@pytest.fixture
def sample_company():
    """Sample Company dict"""
    return {
        "name": "SecureIT GmbH",
        "domain": "secureit.de",
        "description": "IT-Sicherheitsunternehmen aus München",
        "location": "München",
    }
