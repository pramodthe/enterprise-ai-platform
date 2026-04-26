# Build from repository root:
#   docker build -f backend/Dockerfile -t enterprise-ai-api .
FROM python:3.12-slim-bookworm

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

# Runtime libs for wheels (numpy/pandas/matplotlib)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libfreetype6 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

COPY backend /app/backend

EXPOSE 8080
# Cloud Run sets PORT (default 8080).
CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
