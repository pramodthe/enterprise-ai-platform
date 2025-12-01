# rag/chunker.py
from __future__ import annotations

from typing import List

from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_documents(
    documents: List,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> List:
    """
    Split documents into chunks suitable for embeddings.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    return splitter.split_documents(documents)
