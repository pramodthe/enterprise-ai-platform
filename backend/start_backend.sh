#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Enterprise AI Backend Setup..."

# Ensure we are in the backend directory
cd "$(dirname "$0")"

# 1. Check/Create Virtual Environment
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    echo "⬇️ Installing dependencies..."
    pip install -r requirements.txt
else
    echo "✅ Virtual environment found."
    source .venv/bin/activate
fi

# 2. Qdrant Cloud check
if [ -z "$QDRANT_URL" ]; then
    echo "⚠️  QDRANT_URL is not set. Configure Qdrant Cloud in backend/.env."
else
    echo "✅ Using Qdrant Cloud at $QDRANT_URL"
fi

# Start Analytics Agent
echo "📊 Starting Analytics Agent MCP Server..."
python agents/analytics_agent.py server &

# 3. Start Backend
echo "🔥 Starting FastAPI Backend..."
# Using python main.py as it handles the sys.path appending
python main.py
