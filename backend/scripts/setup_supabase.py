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
    print(f"Creating bucket '{bucket_name}'...")
    # Try to get bucket first to see if it exists
    buckets = supabase.storage.list_buckets()
    existing = [b.name for b in buckets]
    
    if bucket_name in existing:
        print(f"Bucket '{bucket_name}' already exists.")
    else:
        supabase.storage.create_bucket(bucket_name, options={"public": False})
        print(f"Bucket '{bucket_name}' created successfully.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
