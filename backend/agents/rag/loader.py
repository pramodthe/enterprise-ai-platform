# rag/loader.py
from __future__ import annotations

import re
from pathlib import Path
from typing import List

from langchain_community.document_loaders import (
    TextLoader,
    Docx2txtLoader,
    PyPDFLoader,
)


def clean_text(text: str) -> str:
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def load_document(file_path: str) -> List:
    """
    Load a document from a *local* temporary file.
    Document bytes were provided by the frontend.
    """
    suffix = Path(file_path).suffix.lower()

    if suffix == ".pdf":
        docs = PyPDFLoader(file_path).load()
    elif suffix == ".docx":
        docs = Docx2txtLoader(file_path).load()
    elif suffix in [".txt", ".md"]:
        docs = TextLoader(file_path, encoding="utf-8").load()
    else:
        docs = TextLoader(file_path, encoding="utf-8").load()

    for doc in docs:
        doc.page_content = clean_text(doc.page_content)

    return docs
