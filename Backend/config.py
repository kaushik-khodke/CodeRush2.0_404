import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://placeholder.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "placeholder-anon-key")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-service-role-key")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./mission_control.db")
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
