import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AISHA AI Services"
    API_V1_STR: str = "/api/v1"
    
    # Database settings
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_USER: str = os.getenv("DB_USER", "saps_user")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "saps_password")
    DB_NAME: str = os.getenv("DB_NAME", "saps_db")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    
    # Ollama settings
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    
    # Gemini Settings
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
