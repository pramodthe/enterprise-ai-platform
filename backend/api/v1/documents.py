from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List
from pathlib import Path

from backend.agents.document_agent import get_document_response, process_document_upload, process_document_deletion
from backend.core.storage import upload_file_to_storage, delete_file_from_storage

router = APIRouter()


class DocumentQuery(BaseModel):
    query: str
    document_id: str | None = None


class DocumentUploadResponse(BaseModel):
    message: str
    document_id: str


class DocumentResponse(BaseModel):
    answer: str
    source_documents: List[str]


@router.post("/documents/query", response_model=DocumentResponse)
async def query_document_agent(query: DocumentQuery):
    """
    Query the document agent for information.
    """
    try:
        answer, sources = get_document_response(query.query, doc_id=query.document_id)
        return DocumentResponse(answer=answer, source_documents=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document query: {str(e)}")


@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Receive a document from the frontend and index it in the RAG pipeline.
    The frontend downloads the file from Supabase and sends the raw bytes here.
    """
    try:
        # Validate file type
        allowed_extensions = {".pdf", ".doc", ".docx", ".txt", ".md"}
        file_ext = Path(file.filename).suffix.lower()

        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{file_ext}'. Allowed: {', '.join(allowed_extensions)}"
            )

        # Upload to Supabase Storage (Service Role)
        content = await file.read()
        try:
            storage_path = upload_file_to_storage(content, file.filename)
        except Exception as e:
            # Log error but maybe continue? Or fail?
            # For now, let's fail if storage fails, as we want to ensure persistence.
            raise HTTPException(status_code=500, detail=f"Failed to upload to storage: {str(e)}")
            
        await file.seek(0)

        # Let the RAG pipeline handle ingestion (saves temp file, loads, chunks)
        # Use storage_path (Supabase filename) as the doc_id to ensure consistency
        doc_id = process_document_upload(file, doc_id=storage_path)

        return DocumentUploadResponse(
            message=f"Document '{file.filename}' uploaded successfully to '{storage_path}' and indexed.",
            document_id=doc_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal error uploading document: {str(e)}"
        )


@router.get("/documents/health")
async def document_agent_health():
    return {"status": "healthy", "agent": "Document Agent"}


@router.get("/documents/list")
async def list_documents():
    """
    List all uploaded documents from Supabase Storage.
    """
    try:
        from backend.core.storage import list_files_in_bucket
        files = list_files_in_bucket()
        return files
    except Exception as e:
        print(f"ERROR in list_documents: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")


@router.delete("/documents/delete/{doc_id}")
async def delete_document(doc_id: str):
    """
    Delete a document from storage and the RAG index.
    """
    try:
        # 1. Delete from Vector DB
        try:
            process_document_deletion(doc_id)
        except Exception as e:
            # Log but continue to try deleting from storage? 
            # Or fail? Let's try to clean up everything.
            print(f"Error deleting from vector DB: {e}")

        # 2. Delete from Storage
        try:
            delete_file_from_storage(doc_id)
        except Exception as e:
             print(f"Error deleting from storage: {e}")
             raise HTTPException(status_code=500, detail=f"Failed to delete file from storage: {str(e)}")

        return {"message": f"Document '{doc_id}' deleted successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")
