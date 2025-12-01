import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

# Load env
load_dotenv(PROJECT_ROOT / ".env")

from backend.agents.rag.vector_store import create_vector_store, create_qdrant_client
from backend.agents.rag.embedding import create_embedding_model

def debug_qdrant():
    print("Creating embedding model...")
    embedding_model = create_embedding_model()
    
    print("Creating Qdrant client...")
    client = create_qdrant_client()
    print(f"Client type: {type(client)}")
    print(f"Client attributes: {dir(client)}")
    
    if hasattr(client, 'search'):
        print("Client has 'search' method.")
    else:
        print("Client DOES NOT have 'search' method.")

    print("Creating vector store...")
    vector_store = create_vector_store(embedding_model, client)
    print(f"Vector store type: {type(vector_store)}")
    
    try:
        print("Attempting similarity search...")
        results = vector_store.similarity_search_with_score("test query", k=1)
        print("Search successful.")
    except Exception as e:
        print(f"Search failed: {e}")

if __name__ == "__main__":
    debug_qdrant()
