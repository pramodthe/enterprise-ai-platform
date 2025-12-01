# rag/vector_store.py
from __future__ import annotations

from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_qdrant import QdrantVectorStore
from langchain_core.vectorstores import VectorStore

from .config import QDRANT_URL, QDRANT_COLLECTION_NAME


def create_qdrant_client() -> QdrantClient:
    return QdrantClient(
        url=QDRANT_URL,
        # api_key=os.getenv("QDRANT_API_KEY")  # enable for cloud
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


def create_vector_store(
    embedding_model,
    client: Optional[QdrantClient] = None,
    collection_name: str = QDRANT_COLLECTION_NAME,
) -> VectorStore:

    if client is None:
        client = create_qdrant_client()

    ensure_collection(client, embedding_model, collection_name)

    return QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embedding_model,
    )
