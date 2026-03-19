import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = ""
    redis_url: str = "redis://localhost:6379"
    qdrant_url: str = "http://localhost:6333"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    resend_api_key: str = ""
    hunter_api_key: str = ""
    apollo_api_key: str = ""
    snov_api_key: str = ""
    zerobounce_api_key: str = ""
    clearbit_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
