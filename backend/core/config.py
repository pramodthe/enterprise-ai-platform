from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # OpenAI API Key (LLM + embeddings)
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    openai_model: str = os.getenv("OPENAI_MODEL", os.getenv("DEFAULT_MODEL", "gpt-4o-mini"))
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./enterprise_ai.db")
    qdrant_url: str = os.getenv("QDRANT_URL", "")
    qdrant_api_key: Optional[str] = os.getenv("QDRANT_API_KEY")
    qdrant_collection_name: str = os.getenv("QDRANT_COLLECTION_NAME", "documents")

    
    # Supabase
    supabase_url: Optional[str] = os.getenv("SUPABASE_URL")
    supabase_key: Optional[str] = os.getenv("SUPABASE_KEY")
    supabase_service_role_key: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    # Observability - Opik
    enable_tracing: bool = os.getenv("ENABLE_TRACING", "False").lower() == "true"
    opik_api_key: Optional[str] = os.getenv("OPIK_API_KEY")
    opik_workspace: Optional[str] = os.getenv("OPIK_WORKSPACE")
    
    # Application
    app_name: str = "Enterprise AI Assistant Platform"
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"
    api_v1_prefix: str = "/api/v1"
    
    # Agent settings
    default_model: str = os.getenv("DEFAULT_MODEL", "gpt-4o-mini")
    max_tokens: int = int(os.getenv("MAX_TOKENS", "1028"))
    temperature: float = float(os.getenv("TEMPERATURE", "0.3"))
    
    # Agent URLs
    employee_mcp_url: Optional[str] = os.getenv("EMPLOYEE_MCP_URL")
    employee_agent_url: Optional[str] = os.getenv("EMPLOYEE_AGENT_URL")
    hr_agent_port: int = int(os.getenv("HR_AGENT_PORT", "8000"))
    analytics_mcp_url: Optional[str] = os.getenv("ANALYTICS_MCP_URL")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
