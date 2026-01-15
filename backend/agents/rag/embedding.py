# rag/embeddings.py
from __future__ import annotations

from typing import Any

from langchain_openai import OpenAIEmbeddings

from backend.core.config import settings


def create_embedding_model() -> Any:
    """
    OpenAI-only embedding loader.
    """
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY must be set for embeddings.")

    return OpenAIEmbeddings(
        openai_api_key=settings.openai_api_key,
        model="text-embedding-3-large",
    )
