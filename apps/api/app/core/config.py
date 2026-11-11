import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "VestiAI Virtual Try-On API"
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v: Union[str, bool]) -> bool:
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "debug", "dev", "development")
        return bool(v)

    # Security
    AUTH_SECRET_KEY: str = "change_this_to_a_secure_random_secret_key_in_production"
    AUTH_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20
    RATE_LIMIT_TRYON_PER_MINUTE: int = 10

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            return json.loads(v)
        elif isinstance(v, list):
            return v
        return []

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://vestiai_user:vestiai_password@localhost:5432/vestiai_db"
    SYNC_DATABASE_URL: str = "postgresql://vestiai_user:vestiai_password@localhost:5432/vestiai_db"
    DB_ECHO: bool = False

    # Redis Queue & Worker
    REDIS_URL: str = "redis://localhost:6379/0"
    WORKER_AUTO_DISPATCH: bool = False
    MAX_JOB_RETRIES: int = 2

    # Storage
    STORAGE_BACKEND: str = "local"  # 'local' or 's3'
    LOCAL_STORAGE_PATH: str = "./storage_data"
    S3_ENDPOINT: str = "https://s3.amazonaws.com"
    S3_BUCKET: str = "vestiai-media-bucket"
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""

    # Media settings
    UPLOAD_MAX_MB: int = 10
    RESULT_RETENTION_DAYS: int = 7

    # AI Model
    MODEL_NAME: str = "idm-vton"
    MODEL_DEVICE: str = "cuda"
    MODEL_PRECISION: str = "fp16"
    MODEL_CHECKPOINT_DIR: str = "./checkpoints"
    INFERENCE_STEPS: int = 30
    INFERENCE_TIMEOUT_SECONDS: int = 120
    REMOTE_INFERENCE_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

