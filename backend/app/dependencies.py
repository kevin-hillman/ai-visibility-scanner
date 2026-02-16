from functools import lru_cache
from sqlalchemy.orm import Session
from app.database import get_db as _get_db
from app.config import Settings


def get_db():
    return _get_db()


@lru_cache
def get_settings() -> Settings:
    return Settings()
