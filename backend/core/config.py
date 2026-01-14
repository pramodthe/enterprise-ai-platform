from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # OpenAI API Key (LLM + embeddings)
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    openai_model: str = os.getenv("OPENAI_MODEL", os.getenv("DEFAULT_MODEL", "gpt-4o-mini"))
    
    # AWS Credentials for Bedrock (alternative to Anthropic API)
    aws_access_key_id: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_default_region: str = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    
    # Use Bedrock instead of Anthropic API
    use_bedrock: bool = os.getenv("USE_BEDROCK", "False").lower() == "true"
    
    # Bedrock model ID for Claude
    bedrock_model_id: str = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-3-5-haiku-20241022-v1:0")
    
    # Bedrock Guardrails
    bedrock_guardrail_id: Optional[str] = os.getenv("BEDROCK_GUARDRAIL_ID")
    bedrock_guardrail_version: str = os.getenv("BEDROCK_GUARDRAIL_VERSION", "DRAFT")
    
    # Document processing embeddings (Bedrock or OpenAI)
    
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
