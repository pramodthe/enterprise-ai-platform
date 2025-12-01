"""
Document Agent for the Enterprise AI Assistant Platform
Using Agentic RAG system
"""

from __future__ import annotations

import logging
import tempfile
import time
from pathlib import Path
from typing import List, Tuple, Optional

from strands import Agent
from qdrant_client import QdrantClient, models
from langchain_core.vectorstores import VectorStore

from backend.agents.rag.loader import load_document
from backend.agents.rag.chunker import chunk_documents
from backend.agents.rag.vector_store import create_vector_store, create_qdrant_client
from backend.agents.rag.embedding import create_embedding_model
from backend.agents.rag.model_loader import create_llm_model
from backend.agents.rag.config import QDRANT_COLLECTION_NAME


logger = logging.getLogger(__name__)


class DocumentRAG:
    """
    High-level Agentic RAG interface.

    Usage:
        rag = DocumentRAG()
        rag.upload_document(file)
        answer, sources = rag.query("What is the PTO policy?")
    """

    def __init__(
        self,
        model=None,
        embedding_model=None,
        qdrant_client: Optional[QdrantClient] = None,
        collection_name: str = QDRANT_COLLECTION_NAME,
    ):
        self.model = model or create_llm_model()
        self.embedding_model = embedding_model or create_embedding_model()
        self.collection_name = collection_name

        # Initialize vector DB (Qdrant)
        self.qdrant_client = qdrant_client or create_qdrant_client()
        self.vector_db: VectorStore = create_vector_store(
            embedding_model=self.embedding_model,
            client=self.qdrant_client,
            collection_name=self.collection_name,
        )

    # ------------------------------------------------------------------ #
    # Document Ingestion
    # ------------------------------------------------------------------ #

    def upload_document(self, file, doc_id: Optional[str] = None) -> str:
        """
        Process an uploaded document from frontend and add it to vector DB.

        file: UploadFile or file-like object with .filename & .file
        doc_id: Optional unique ID for the document (e.g. Supabase filename)
        Returns: unique document ID
        """
        filename = getattr(file, "filename", "uploaded_document")
        content = file.file.read()
        file.file.seek(0)

        suffix = Path(filename).suffix or ".txt"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            documents = load_document(tmp_path)
            chunks = chunk_documents(documents)

            if not doc_id:
                doc_id = f"{Path(filename).stem}_{int(time.time())}"

            # Add metadata to chunks
            for chunk in chunks:
                chunk.metadata["doc_id"] = doc_id
                chunk.metadata["source"] = filename

            self.vector_db.add_documents(chunks)

            logger.info(f"Indexed '{doc_id}' into collection '{self.collection_name}'")
            return doc_id

        finally:
            Path(tmp_path).unlink(missing_ok=True)

    # ------------------------------------------------------------------ #
    # Retrieval
    # ------------------------------------------------------------------ #

    def _similarity_search(
        self, query: str, k: int = 3, doc_id: Optional[str] = None
    ) -> Tuple[List, List[str], List[float]]:
        
        filter_condition = None
        if doc_id:
            filter_condition = models.Filter(
                must=[
                    models.FieldCondition(
                        key="metadata.doc_id",
                        match=models.MatchValue(value=doc_id),
                    )
                ]
            )

        results = self.vector_db.similarity_search_with_score(
            query, k=k, filter=filter_condition
        )

        docs = [doc for doc, _ in results]
        scores = [float(score) for _, score in results]
        sources = [doc.metadata.get("source", "Unknown") for doc in docs]

        return docs, sources, scores

    def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document and its chunks from the vector DB.
        """
        try:
            # Create filter for the specific doc_id
            filter_condition = models.Filter(
                must=[
                    models.FieldCondition(
                        key="metadata.doc_id",
                        match=models.MatchValue(value=doc_id),
                    )
                ]
            )
            
            # Delete points matching the filter
            self.qdrant_client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(filter=filter_condition)
            )
            logger.info(f"Deleted document '{doc_id}' from collection '{self.collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Failed to delete document '{doc_id}': {e}")
            raise

    # ------------------------------------------------------------------ #
    # Answer Generation
    # ------------------------------------------------------------------ #

    def query(self, query: str, k: int = 3, doc_id: Optional[str] = None) -> Tuple[str, List[str]]:
        """
        Query the knowledge base and return (answer, source_document_names).
        """

        try:
            docs, sources, _ = self._similarity_search(query, k=k, doc_id=doc_id)

            if not docs:
                raise ValueError("No documents retrieved")

            context = "\n\n".join(
                f"Document: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}"
                for doc in docs
            )

            # Main system prompt for normal operation
            system_prompt = (
                "You are an internal Company Knowledge Assistant for employees.\n"
                "You answer questions ONLY using the internal company documents provided in the context.\n\n"
                "You MUST always respond as valid JSON (no extra text before or after), using this exact structure:\n\n"
                "{\n"
                '  "answer_markdown": "<full, well-formatted answer in GitHub-flavored Markdown. Use headers (##), bold (**), lists. IMPORTANT: Use Markdown Tables for comparing data.>",\n'
                '  "sources": [\n'
                "    {\n"
                '      "title": "<document name from the context>",\n'
                '      "url": "<file path or URL if available>",\n'
                '      "breadcrumbs": "<short description of where in the document this came from (e.g. Folder > Subfolder)>"\n'
                "    }\n"
                "  ],\n"
                '  "follow_up_questions": [\n'
                '    "<natural language follow-up question 1 that the user might click>",\n'
                '    "<follow-up question 2>",\n'
                '    "<follow-up question 3>"\n'
                "  ],\n"
                '  "user_notices": [\n'
                '    "<optional important disclaimers or caveats (e.g. Data is from 2022)>"\n'
                "  ]\n"
                "}\n\n"
                "Rules for `answer_markdown` (this is what will be rendered in the chat UI):\n"
                "- Use clear headings (##, ###) and bullet lists.\n"
                "- Use **Markdown Tables** whenever comparing values, dates, or costs.\n"
                "- For policies and procedures, structure answers like:\n"
                "  - Summary\n"
                "  - Key rules / steps\n"
                "  - Escalation / who to contact\n"
                "- Use bold to highlight important terms, deadlines, and exceptions.\n"
                "- Be professional, clear, and friendly. Assume you are talking to a company employee.\n\n"
                "Very important behavioural rules:\n"
                "1. Use ONLY the information present in the context below. Do NOT make up or assume company policies.\n"
                "2. If the answer cannot be reliably found in the context, set:\n"
                '   - \"answer_markdown\": \"The information is not available in the current documents.\"\n'
                "   - Provide at least one follow-up question that helps narrow what the user needs.\n"
                "3. When possible, mention which documents support the answer in both `answer_markdown` and `sources`.\n"
                "4. If policies differ by location, role, or employment type and this is visible in the context, clearly call this out in `answer_markdown` and `user_notices`.\n\n"
                "Use the following context as your ONLY knowledge source:\n\n"
                "--- BEGIN CONTEXT ---\n"
                f"{context}\n"
                "--- END CONTEXT ---\n"
            )

        except Exception as e:
            logger.error(f"Vector DB error: {e}")
            sources = ["Sample Data"]

            context = """
Document: Employee Handbook
- Work hours: 9 AM - 5 PM
- PTO: 20 days per year
"""

            # Fallback system prompt when vector DB is unavailable
            system_prompt = (
                "You are an internal Company Knowledge Assistant for employees.\n\n"
                "The real document database is temporarily unavailable.\n"
                "You have access ONLY to the following SAMPLE context, which may not fully match the real company.\n\n"
                "You MUST still answer in the exact JSON format described below, and you MUST NOT invent policies not present in the sample.\n\n"
                "SAMPLE CONTEXT:\n"
                "--- BEGIN SAMPLE CONTEXT ---\n"
                f"{context}\n"
                "--- END SAMPLE CONTEXT ---\n\n"
                "Respond using this JSON schema (no extra text before or after):\n\n"
                "{\n"
                '  "answer_markdown": "<full, well-formatted answer in GitHub-flavored Markdown. Use tables if helpful.>",\n'
                '  "sources": [\n'
                "    {\n"
                '      "title": "<document name from the sample context>",\n'
                '      "url": "<file path or URL if available>",\n'
                '      "breadcrumbs": "<short description of where in the document this came from>"\n'
                "    }\n"
                "  ],\n"
                '  "follow_up_questions": [\n'
                '    "<natural language follow-up question 1>",\n'
                '    "<follow-up question 2>"\n'
                "  ],\n"
                '  "user_notices": [\n'
                '    "<disclaimers or caveats, for example: Sample data only – verify with HR before relying on this information>"\n'
                "  ]\n"
                "}\n"
            )

        # LLM Agent
        document_agent = Agent(
            model=self.model,
            name="Document Assistant",
            description="Retrieves and summarizes company documents and policies in structured JSON",
            system_prompt=system_prompt,
        )

        answer = document_agent(query)
        return str(answer), sources


# Global instance
_rag_instance = None

def get_rag_instance():
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = DocumentRAG()
    return _rag_instance

def get_document_response(query: str, doc_id: Optional[str] = None) -> Tuple[str, List[str]]:
    """
    Get response from Document Agent
    """
    rag = get_rag_instance()
    return rag.query(query, doc_id=doc_id)

def process_document_upload(file, doc_id: Optional[str] = None) -> str:
    """
    Process document upload
    """
    rag = get_rag_instance()
    return rag.upload_document(file, doc_id)

def process_document_deletion(doc_id: str) -> bool:
    """
    Process document deletion
    """
    rag = get_rag_instance()
    return rag.delete_document(doc_id)