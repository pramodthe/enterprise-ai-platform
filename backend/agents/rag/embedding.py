# rag/embeddings.py
from __future__ import annotations

from typing import Any

from langchain_aws import BedrockEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

from backend.core.config import settings


def create_embedding_model() -> Any:
    """
    Production-safe embedding loader with:
      1. Bedrock Titan v2 (preferred)
      2. OpenAI embeddings (fallback)
      3. HuggingFace local embeddings (final fallback)
    """
    # Try Bedrock first
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        import boto3

        bedrock_client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_default_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )

        return BedrockEmbeddings(
            client=bedrock_client,
            model_id="amazon.titan-embed-text-v2:0",
        )
    # Try OpenAI next
    elif settings.openai_api_key:
        return OpenAIEmbeddings(
            openai_api_key=settings.openai_api_key,
            model="text-embedding-3-large",  # production-grade
        )
    # Try HuggingFace last
    else:
        return HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
