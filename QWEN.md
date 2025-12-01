# Enterprise AI Assistant Platform

## Project Overview

The Enterprise AI Assistant Platform is a comprehensive multi-agent AI system built with FastAPI (backend) and React/Vite (frontend) for enterprise use cases. The platform features specialized agents for HR queries, analytics/payroll calculations, and document search using Retrieval-Augmented Generation (RAG) with vector databases. It includes advanced observability with Opik tracing, security guardrails for content safety, and is designed with AWS Bedrock (Anthropic Claude) as the primary LLM provider.

## Architecture

### Backend (Python/FastAPI)
- **Port**: 8000
- **Technology**: FastAPI, Python 3.9+
- **Agents**: 
  - HR Agent: Handles employee and organizational queries
  - Analytics Agent: Performs calculations and payroll processing
  - Document Agent: RAG-based document search and Q&A
- **External Services**: 
  - AWS Bedrock (Claude models)
  - Qdrant vector database (port 6333)
  - Opik for observability/tracing

### Frontend (React/Vite)
- **Port**: 3000
- **Technology**: React 18, Vite, Material UI, Tailwind CSS
- **Proxy**: Forward API requests from port 3000 to backend at port 8000

### Data Flow
1. User sends query to API gateway
2. Guardrails check for content safety
3. Root chatbot orchestrates conversation and routes to specialized agents
4. Agents process requests using LLMs and external services
5. Response returned with context and metadata

## Building and Running

### Backend Setup
```bash
cd backend
./start_backend.sh
```
Or manually:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your credentials
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Project-specific Scripts
The project includes utility scripts to manage ports:
- `npm run stop` - Kill processes on ports 8000 and 3000
- `npm run stop-backend` - Kill process on port 8000 only
- `npm run stop-frontend` - Kill process on port 3000 only
- `bash kill_ports.sh`, `bash kill_port_8000.sh`, `bash kill_port_3000.sh` - Direct shell scripts

## Development Conventions

### Security
- Secrets stored in .env files (never committed)
- Guardrails implemented for content safety and prompt injection prevention
- Input validation on all endpoints
- Structured logging without PII
- Trust boundaries clearly defined between system components

### Testing
- Unit and integration tests available in backend/tests/
- Demo scripts in backend/scripts/ for end-to-end testing
- API documentation available at http://localhost:8000/docs (Swagger UI)

### Observability
- Comprehensive tracing with Opik for all agent interactions
- Structured logging with correlation IDs
- Token usage tracking for cost management
- Performance monitoring with latency metrics

### Architecture Patterns
- Multi-Agent System with specialized agents
- Retrieval-Augmented Generation (RAG) for document search
- Distributed tracing with Opik
- Session management for conversation continuity
- Fallback mechanisms for external service failures