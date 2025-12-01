from supabase import create_client, Client
from backend.core.config import settings
import time
from pathlib import Path

def get_supabase_client() -> Client:
    """
    Returns a Supabase client instance with Service Role privileges.
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
    
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

def upload_file_to_storage(file_content: bytes, filename: str, bucket_name: str = "documents") -> str:
    """
    Uploads a file to Supabase Storage and returns the path.
    """
    client = get_supabase_client()
    
    # Generate a unique filename
    unique_filename = f"{int(time.time())}_{filename}"
    
    try:
        client.storage.from_(bucket_name).upload(
            path=unique_filename,
            file=file_content,
            file_options={"content-type": "application/octet-stream"}
        )
        return unique_filename
    except Exception as e:
        raise Exception(f"Failed to upload to Supabase: {str(e)}")


def list_files_in_bucket(bucket_name: str = "documents") -> list:
    """
    Lists files in the specified Supabase Storage bucket.
    """
    client = get_supabase_client()
    try:
        res = client.storage.from_(bucket_name).list()
        # Sort by created_at desc
        res.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return res
    except Exception as e:
        raise Exception(f"Failed to list files from Supabase: {str(e)}")


def delete_file_from_storage(filename: str, bucket_name: str = "documents") -> bool:
    """
    Deletes a file from Supabase Storage.
    """
    client = get_supabase_client()
    try:
        client.storage.from_(bucket_name).remove([filename])
        return True
    except Exception as e:
        raise Exception(f"Failed to delete file from Supabase: {str(e)}")
