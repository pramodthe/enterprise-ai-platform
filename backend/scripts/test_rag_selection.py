import sys
import os
import asyncio
from pathlib import Path
from unittest.mock import MagicMock

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.agents.document_agent import DocumentRAG

async def test_rag_selection():
    print("Initializing DocumentRAG...")
    # Mocking QdrantClient to avoid actual DB connection issues during simple test if needed,
    # but ideally we want to test with the actual client if available.
    # For this test, we will assume the environment is set up or we mock the vector store.
    
    # However, since we want to verify the filtering logic, we should probably use a real instance 
    # if the user has Qdrant running. The user has `debug_qdrant.py` open, so Qdrant might be running.
    # Let's try to use the real one, but if it fails, we mock.
    
    try:
        # Mock the LLM to avoid Bedrock/Anthropic errors during retrieval test
        mock_llm = MagicMock()
        mock_llm.return_value = "Mocked Answer"
        
        rag = DocumentRAG(model=mock_llm)
        print("DocumentRAG initialized with Mock LLM.")
    except Exception as e:
        print(f"Failed to initialize DocumentRAG: {e}")
        return

    # Create dummy files
    file_a_content = b"The sky is blue."
    file_b_content = b"The grass is green."
    
    class MockFile:
        def __init__(self, filename, content):
            self.filename = filename
            self.file = MagicMock()
            self.file.read.return_value = content
            self.file.seek.return_value = None

    file_a = MockFile("sky.txt", file_a_content)
    file_b = MockFile("grass.txt", file_b_content)

    print("Uploading documents...")
    try:
        doc_id_a = rag.upload_document(file_a)
        print(f"Uploaded sky.txt -> {doc_id_a}")
        
        doc_id_b = rag.upload_document(file_b)
        print(f"Uploaded grass.txt -> {doc_id_b}")
    except Exception as e:
        print(f"Upload failed (likely due to missing Qdrant or embedding model): {e}")
        print("Skipping integration test.")
        return

    print("\nTesting Query without ID (Should find something)...")
    ans, sources = rag.query("What color is the sky?")
    print(f"Answer: {ans}")
    print(f"Sources: {sources}")

    print(f"\nTesting Query with doc_id={doc_id_a} (Should be about sky)...")
    ans_a, sources_a = rag.query("What color is the sky?", doc_id=doc_id_a)
    print(f"Answer: {ans_a}")
    print(f"Sources: {sources_a}")

    print(f"\nTesting Query with doc_id={doc_id_b} (Should NOT find sky info or be irrelevant)...")
    # It might say "Information not available" or hallucinate, but sources should be restricted.
    ans_b, sources_b = rag.query("What color is the sky?", doc_id=doc_id_b)
    print(f"Answer: {ans_b}")
    print(f"Sources: {sources_b}")

    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(test_rag_selection())
