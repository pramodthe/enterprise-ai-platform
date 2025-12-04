# Enterprise AI Assistant Platform

A comprehensive AI-powered assistant platform for enterprise use, featuring specialized agents for HR, Analytics, and Document Intelligence. Built with FastAPI, React, and AWS Bedrock (or Anthropic Claude), this platform provides intelligent routing, RAG-based document search, and real-time analytics capabilities.
---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Specialized Agents](#specialized-agents)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The Enterprise AI Assistant Platform is a production-ready, multi-agent AI system designed to streamline enterprise operations. It intelligently routes user queries to specialized agents, each optimized for specific domains:

- **HR Agent**: Employee information, organizational structure, skills management, and HR policy queries
- **Analytics Agent**: Business intelligence, data analysis, chart generation, and metric calculations
- **Document Agent**: Agentic RAG-based document search, policy retrieval, and knowledge management

The platform features a sophisticated routing system that analyzes queries and directs them to the most appropriate agent, with fallback mechanisms and confidence scoring.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │HR Portal │  │Analytics │  │Documents │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
┌────────────────────────┼────────────────────────────────────┐
│                   FastAPI Backend                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Root Chatbot (Orchestrator)             │   │
│  │         ┌────────────────────────────────┐           │   │
│  │         │      Agent Router              │           │   │
│  │         │  - Keyword Analysis            │           │   │
│  │         │  - Context Awareness           │           │   │
│  │         │  - Confidence Scoring          │           │   │
│  │         └────────────────────────────────┘           │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────┬───────┴────────┬──────────────┐          │
│  │              │                │              │          │
│  ▼              ▼                ▼              ▼          │
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │
│ │   HR   │  │Analytics│ │Document│  │ Future │           │
│ │ Agent  │  │ Agent   │ │ Agent  │  │ Agents │           │
│ └────────┘  └────────┘  └────────┘  └────────┘           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│              External Services & Storage                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   AWS    │  │  Qdrant  │  │ Supabase │  │   Opik   │   │
│  │ Bedrock  │  │ Vector DB│  │ Storage  │  │ Tracing  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Flow

1. **User Query** → Frontend sends request to FastAPI backend
2. **Root Chatbot** → Receives query and invokes Agent Router
3. **Agent Router** → Analyzes query using:
   - Keyword matching (domain-specific vocabularies)
   - Context awareness (conversation history)
   - Confidence scoring (threshold-based routing)
4. **Specialized Agent** → Processes query with domain expertise
5. **Response** → Returns structured response to frontend

### Key Architectural Patterns

- **Microservices Architecture**: Modular, independently deployable agents
- **Intelligent Routing**: Dynamic query routing with fallback strategies
- ** Agentic RAG (Retrieval-Augmented Generation)**: Document agent uses vector search for accurate responses
- **Observability**: Integrated tracing with Opik for monitoring and debugging
- **Guardrails**: AWS Bedrock Guardrails for content safety and compliance

---

## Features

### Core Features

✅ **Multi-Agent System**
- Intelligent query routing to specialized agents
- Confidence-based decision making
- Automatic fallback mechanisms

✅ **HR Agent**
- Employee directory and organizational structure
- Skills and competency tracking
- HR policy search (integrated with Document Agent)
- Manager hierarchy and reporting structure

✅ **Analytics Agent**
- Business intelligence and data analysis
- Chart generation (line, bar, scatter plots)
- Comprehensive business data (10+ datasets)
- Metric calculations and trend analysis
- Automated report generation

✅ **Document Agent (RAG)**
- Vector-based document search using Qdrant
- Support for PDF, DOCX, TXT files
- Semantic search with embeddings
- Source attribution and citation
- Document upload and management

✅ **Unified Chat Interface**
- Real-time conversational AI
- Markdown rendering with syntax highlighting
- Image support (charts, diagrams)
- Follow-up question suggestions
- Session management

✅ **Security & Compliance**
- AWS Bedrock Guardrails integration
- Content filtering and safety checks
- Configurable guardrail policies

✅ **Observability**
- Opik integration for tracing
- Request/response logging
- Performance monitoring
- Error tracking

---

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **AI/ML**: 
  - AWS Bedrock (Claude models)
  - Anthropic Claude API (alternative)
  - Strands Agent Framework
- **Vector Database**: Qdrant
- **Document Processing**: LangChain, docx2txt, pypdf
- **Embeddings**: Sentence Transformers / AWS Bedrock
- **Storage**: Supabase (optional)
- **Observability**: Opik
- **Data Visualization**: Matplotlib

### Frontend
- **Framework**: React 18.2
- **UI Library**: Material-UI (MUI)
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Markdown**: react-markdown, react-syntax-highlighter
- **Charts**: Recharts

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (production)
- **Development Server**: Vite

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9+** (with pip and venv)
- **Node.js 16+** and npm
- **Docker** and Docker Compose
- **AWS Account** (for Bedrock) OR **Anthropic API Key**
- **Git**

### Optional
- **Supabase Account** (for document storage)
- **Opik Account** (for observability)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd enterprise-ai-assistant
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

### 4. Start Qdrant Vector Database

```bash
# Using Docker
docker run -d -p 6333:6333 --name qdrant qdrant/qdrant

# Or using Docker Compose (recommended)
docker-compose up -d qdrant
```

---

## Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
# AWS Bedrock Configuration (Primary Option)
USE_BEDROCK=True
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_DEFAULT_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0

# Optional: Bedrock Guardrails
BEDROCK_GUARDRAIL_ID=your_guardrail_id
BEDROCK_GUARDRAIL_VERSION=1

# Alternative: Anthropic API (if not using Bedrock)
# USE_BEDROCK=False
# api_key=your_anthropic_api_key_here

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=documents

# Optional: Observability
ENABLE_TRACING=false
OPIK_API_KEY=your_opik_api_key
OPIK_WORKSPACE=your_workspace_name

# Optional: Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Frontend Configuration

Create a `.env` file in the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Running the Application

### Option 1: Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

### Option 2: Manual Start (Development)

#### Terminal 1: Start Backend

```bash
cd backend
source .venv/bin/activate
python main.py
```

Or use the startup script:

```bash
cd backend
chmod +x start_backend.sh
./start_backend.sh
```

#### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

---

## API Documentation

### Interactive API Docs

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Chatbot

```http
POST /api/v1/chatbot/query
Content-Type: application/json

{
  "message": "Who is the CTO?",
  "session_id": "optional-session-id"
}
```

#### HR Agent

```http
POST /api/v1/hr/query
Content-Type: application/json

{
  "question": "What are Sarah Chen's skills?"
}
```

#### Analytics Agent

```http
POST /api/v1/analytics/query
Content-Type: application/json

{
  "query": "Show monthly revenue chart"
}
```

#### Document Agent

```http
# Upload Document
POST /api/v1/documents/upload
Content-Type: multipart/form-data

file: <file>

# Query Documents
POST /api/v1/documents/query
Content-Type: application/json

{
  "query": "What is the PTO policy?"
}

# Delete Document
DELETE /api/v1/documents/{doc_id}
```

---

## Project Structure

```
enterprise-ai-assistant/
├── backend/
│   ├── agents/
│   │   ├── hr_agent.py              # HR specialized agent
│   │   ├── analytics_agent.py       # Analytics & BI agent
│   │   ├── document_agent.py        # RAG document agent
│   │   └── rag/                     # RAG components
│   │       ├── loader.py            # Document loaders
│   │       ├── chunker.py           # Text chunking
│   │       ├── embedding.py         # Embedding models
│   │       ├── vector_store.py      # Qdrant integration
│   │       └── model_loader.py      # LLM initialization
│   ├── api/
│   │   └── v1/                      # API routes
│   │       ├── chatbot.py
│   │       ├── hr.py
│   │       ├── analytics.py
│   │       └── documents.py
│   ├── chatbot/
│   │   ├── root_chatbot.py          # Main orchestrator
│   │   ├── agent_router.py          # Intelligent routing
│   │   ├── local_agent.py           # Agent client
│   │   └── factory.py               # Agent factory
│   ├── core/
│   │   ├── config.py                # Configuration
│   │   ├── opik_config.py           # Observability
│   │   ├── storage.py               # Storage utilities
│   │   └── tracing_utils.py         # Tracing helpers
│   ├── data/
│   │   └── business_data.py         # Sample business data
│   ├── main.py                      # FastAPI application
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UnifiedChat.jsx      # Main chat interface
│   │   │   ├── MessageBubble.jsx    # Message display
│   │   │   ├── MarkdownRenderer.jsx # Markdown support
│   │   │   ├── DocumentQuery.jsx    # Document search
│   │   │   └── AgentCard.jsx        # Agent cards
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── HRAssistant.jsx      # HR interface
│   │   │   ├── AnalyticsHub.jsx     # Analytics interface
│   │   │   └── DocumentIntelligence.jsx # Document interface
│   │   ├── services/
│   │   │   └── api.js               # API client
│   │   ├── store/
│   │   │   ├── store.js             # Redux store
│   │   │   └── agentsSlice.js       # Agent state
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Specialized Agents

### HR Agent

**Capabilities:**
- Employee directory lookup
- Organizational structure queries
- Skills and competency search
- Manager hierarchy
- HR policy search (via Document Agent integration)

**Sample Data:**
- 6 employees with skills and departments
- 3-level organizational hierarchy
- Department structure

**Example Queries:**
- "Who is the CTO?"
- "What are Sarah Chen's skills?"
- "Who reports to Jennifer Lee?"
- "What is the PTO policy?" (routes to Document Agent)

### Analytics Agent

**Capabilities:**
- Mathematical calculations (add, subtract, multiply, divide, average, percent change)
- Data querying (10+ business datasets)
- Chart generation (line, bar, scatter)
- Automated report generation
- Trend analysis and insights

**Available Datasets:**
- Sales (monthly revenue, expenses, customers, orders)
- Products (units sold, returns, revenue, profit)
- Traffic (website visitors, conversions, bounce rate)
- Demographics (customer segments, spend, retention)
- Regions (geographic sales, customers, growth)
- Marketing (channels, visitors, conversions, ROI)
- Employees (departments, salaries, satisfaction)
- Quarterly (revenue, profit, margin)
- Satisfaction (customer satisfaction scores)
- Inventory (stock levels, value by category)

**Example Queries:**
- "Show monthly revenue chart"
- "Calculate average sales for Q1"
- "Compare product performance"
- "Generate a comprehensive sales report"

### Document Agent (RAG)

**Capabilities:**
- Semantic document search
- Multi-format support (PDF, DOCX, TXT)
- Vector-based retrieval
- Source attribution
- Document management (upload, delete)

**Architecture:**
- **Loader**: Extracts text from documents
- **Chunker**: Splits documents into semantic chunks
- **Embeddings**: Converts text to vectors
- **Vector Store**: Qdrant for similarity search
- **Generator**: LLM generates answers from retrieved context

**Example Queries:**
- "What is the PTO policy?"
- "Explain the remote work guidelines"
- "What are the benefits?"

---

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Python linting
cd backend
flake8 .
black .

# JavaScript linting
cd frontend
npm run lint
```

### Adding a New Agent

1. Create agent file in `backend/agents/`:

```python
# backend/agents/my_agent.py
from strands import Agent
from backend.agents.rag.model_loader import create_llm_model

def get_my_agent_response(query: str) -> str:
    model = create_llm_model()
    agent = Agent(
        model=model,
        name="My Agent",
        system_prompt="You are a specialized agent for..."
    )
    return str(agent(query))
```

2. Create API route in `backend/api/v1/`:

```python
# backend/api/v1/my_agent.py
from fastapi import APIRouter
from backend.agents.my_agent import get_my_agent_response

router = APIRouter()

@router.post("/my-agent/query")
async def query_my_agent(request: dict):
    response = get_my_agent_response(request["query"])
    return {"response": response}
```

3. Register in `backend/main.py`:

```python
from backend.api.v1 import my_agent
app.include_router(my_agent.router, prefix="/api/v1", tags=["my-agent"])
```

4. Update Agent Router keywords in `backend/chatbot/agent_router.py`

---

## Deployment

### Production Deployment with Docker

```bash
# Build and start all services
docker-compose up -d --build

# Scale services
docker-compose up -d --scale backend=3

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Environment Variables for Production

Update `.env` files with production values:
- Use production AWS credentials
- Enable Bedrock Guardrails
- Configure Supabase for document storage
- Enable Opik tracing
- Set `DEBUG=False`

### Security Considerations

- Use environment variables for all secrets
- Enable HTTPS/TLS
- Configure CORS properly (restrict origins)
- Use AWS IAM roles instead of access keys
- Enable Bedrock Guardrails for content safety
- Implement rate limiting
- Add authentication/authorization

---

## Troubleshooting

### Common Issues

**Issue**: Backend fails to start
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Issue**: Qdrant connection error
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker restart qdrant

# Check logs
docker logs qdrant
```

**Issue**: AWS Bedrock authentication error
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

**Issue**: Frontend can't connect to backend
```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS configuration in backend/main.py
# Verify API URL in frontend/src/services/api.js
```

### Logs

```bash
# Backend logs
cd backend
tail -f logs/app.log

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f qdrant
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8, use Black formatter
- **JavaScript**: Follow Airbnb style guide, use ESLint
- **Commits**: Use conventional commits format

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check the documentation at `/docs`

---

## Acknowledgments

- **Strands Agent Framework** for agent orchestration
- **AWS Bedrock** for Claude model access
- **Anthropic** for Claude AI models
- **Qdrant** for vector database
- **LangChain** for RAG components
- **FastAPI** for backend framework
- **React** and **Material-UI** for frontend

---

**Built with ❤️ for Enterprise AI**
