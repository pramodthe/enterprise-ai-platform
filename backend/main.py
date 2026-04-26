import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(str(Path(__file__).parent.parent))

from backend.api.v1 import analytics, chatbot, hr
from backend.core.config import cors_origins_list

app = FastAPI(
    title="Enterprise AI Assistant Platform",
    description="A comprehensive AI assistant platform for enterprise use",
    version="1.0.0",
)

_origins = cors_origins_list()
# Wildcard + credentials is invalid in browsers; this API uses header auth, not cookies.
_allow_credentials = "*" not in _origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot.router, prefix="/api/v1", tags=["chatbot"])
app.include_router(hr.router, prefix="/api/v1", tags=["hr"])
app.include_router(analytics.router, prefix="/api/v1", tags=["analytics"])


@app.get("/")
async def root():
    return {"message": "Enterprise AI Assistant Platform API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Enterprise AI Assistant Platform"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
