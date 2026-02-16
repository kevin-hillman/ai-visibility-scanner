from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./geo_engine.db"
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    PERPLEXITY_API_KEY: str = ""
    INDUSTRY_CONFIG_DIR: str = "./industries"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    API_PREFIX: str = "/api/v1"

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }
