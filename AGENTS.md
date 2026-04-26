---
description: Enterprise AI platform — FastAPI backend + Vite/React frontend
alwaysApply: true
---

# Enterprise AI Platform

- **Backend**: `backend/` — FastAPI. Env: `backend/.env`. Run: `cd backend && .venv/bin/python main.py` (or `npm run backend` from `new_frontend`).
- **Frontend**: `new_frontend/` — Vite + React. Run: `npm run dev`, or `npm run dev:full` to start UI and API together.

See `README.md` for setup, env vars, and API routes. **Google Cloud Run**: `deploy/gcp/README.md` and `deploy/gcp/cloudbuild.yaml`.
