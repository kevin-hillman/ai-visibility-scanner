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
    """Minimal Industry Config für Tests"""
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
            "total": 4,
            "categories": {
                "brand": {
                    "count": 2,
                    "templates": [
                        "{company_name} Erfahrungen",
                        "Ist {company_name} gut für {service}?",
                    ]
                },
                "service": {
                    "count": 2,
                    "templates": [
                        "Beste {service} Anbieter in {region}",
                        "Top {service} für Unternehmen",
                    ]
                },
            },
            "services": ["Penetration Testing", "SOC as a Service"],
            "threats": ["Ransomware"],
            "regions": ["Deutschland"],
            "industry_terms": ["Cybersecurity"],
            "target_audiences": ["Mittelstand"],
            "competitors": ["CrowdStrike"],
        }
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
