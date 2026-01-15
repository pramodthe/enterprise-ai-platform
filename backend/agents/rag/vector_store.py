# rag/vector_store.py
from __future__ import annotations

from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType
from langchain_qdrant import QdrantVectorStore
from langchain_core.vectorstores import VectorStore

from backend.core.config import settings


def create_qdrant_client() -> QdrantClient:
    return QdrantClient(
        url=settings.qdrant_url,
        api_key=settings.qdrant_api_key,
    )


def ensure_collection(client: QdrantClient, embedding_model, collection_name: str):
    """
    Ensure the Qdrant collection exists with correct vector dimension.
    This prevents DimensionMismatchError, which breaks many RAG systems.
    """
    existing = {c.name for c in client.get_collections().collections}

    if collection_name in existing:
        return

    # Determine vector size by embedding dummy text
    sample_vector = embedding_model.embed_query("sample text")
    vector_dim = len(sample_vector)

    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(
            size=vector_dim,
            distance=Distance.COSINE,
        ),
    )


def ensure_payload_indexes(client: QdrantClient, collection_name: str) -> None:
    """
    Ensure payload indexes exist for fields used in filters.
    """
    try:
        client.create_payload_index(
            collection_name=collection_name,
            field_name="metadata.doc_id",
            field_schema=PayloadSchemaType.KEYWORD,
        )
    except Exception as exc:
        message = str(exc).lower()
        if "already exists" not in message:
            raise


def create_vector_store(
    embedding_model,
    client: Optional[QdrantClient] = None,
    collection_name: str = settings.qdrant_collection_name,
) -> VectorStore:

    if client is None:
        client = create_qdrant_client()

    ensure_collection(client, embedding_model, collection_name)
    ensure_payload_indexes(client, collection_name)

    return QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embedding_model,
    )
