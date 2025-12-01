import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

# Load env
load_dotenv(PROJECT_ROOT / ".env")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")
    sys.exit(1)

supabase: Client = create_client(url, key)

bucket_name = "documents"

try:
    print(f"Updating bucket '{bucket_name}' to public...")
    supabase.storage.update_bucket(bucket_name, options={"public": True})
    print(f"Bucket '{bucket_name}' is now public.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
