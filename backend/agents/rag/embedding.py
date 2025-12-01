# rag/embeddings.py
from __future__ import annotations

from typing import Any

from langchain_aws import BedrockEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

from .config import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    OPENAI_API_KEY,
)


def create_embedding_model() -> Any:
    """
    Production-safe embedding loader with:
      1. Bedrock Titan v2 (preferred)
      2. OpenAI embeddings (fallback)
      3. HuggingFace local embeddings (final fallback)
    """
    # Try Bedrock first
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        import boto3

        bedrock_client = boto3.client(
            "bedrock-runtime",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )

        return BedrockEmbeddings(
            client=bedrock_client,
            model_id="amazon.titan-embed-text-v2:0",
        )
    # Try OpenAI next
    elif OPENAI_API_KEY:
        return OpenAIEmbeddings(
            openai_api_key=OPENAI_API_KEY,
            model="text-embedding-3-large",  # production-grade
        )
    # Try HuggingFace last
    else:
        return HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
