# rag/model_loader.py
from __future__ import annotations

from backend.core.config import settings
from strands.models.openai import OpenAIModel as LLMModel


def create_llm_model() -> LLMModel:
    """
    Create the main LLM model using OpenAI.
    """
    if not settings.openai_api_key:
        raise RuntimeError("OpenAI 'OPENAI_API_KEY' environment variable is not set.")

    return LLMModel(
        client_args={"api_key": settings.openai_api_key},
        max_tokens=1028,
        model_id=settings.openai_model,
        params={"temperature": 0.3},
    )
