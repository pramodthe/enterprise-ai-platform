# rag/config.py
import os
from pathlib import Path

from dotenv import load_dotenv

# Resolve project root (backend directory)
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Load .env from project root if present
load_dotenv(PROJECT_ROOT / ".env")

# Feature flags / mode
USE_BEDROCK: bool = os.getenv("USE_BEDROCK", "False").lower() == "true"

# AWS config
AWS_REGION: str = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
AWS_ACCESS_KEY_ID: str | None = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY: str | None = os.getenv("AWS_SECRET_ACCESS_KEY")

# OpenAI config
OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")

# Qdrant config
QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_COLLECTION_NAME: str = os.getenv("QDRANT_COLLECTION_NAME", "documents")

# LLM model IDs (Haiku defaults)
BEDROCK_MODEL_ID_DEFAULT: str = os.getenv(
    "BEDROCK_MODEL_ID",
    "anthropic.claude-3-haiku-20240307-v1:0",
)
ANTHROPIC_MODEL_ID_DEFAULT: str = os.getenv(
    "DEFAULT_MODEL",
    "claude-3-haiku-20240307",
)
