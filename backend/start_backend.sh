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

# 2. Check/Start Qdrant
echo "🐘 Checking Qdrant Vector DB..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH. Please install Docker."
    exit 1
fi

if docker ps | grep -q qdrant; then
    echo "✅ Qdrant is already running."
elif docker ps -a | grep -q qdrant; then
    echo "🔄 Starting existing Qdrant container..."
    docker start qdrant
else
    echo "🆕 Starting new Qdrant container..."
    docker run -d -p 6333:6333 --name qdrant qdrant/qdrant
fi

# Start Analytics Agent
echo "📊 Starting Analytics Agent MCP Server..."
python agents/analytics_agent.py server &

# 3. Start Backend
echo "🔥 Starting FastAPI Backend..."
# Using python main.py as it handles the sys.path appending
python main.py
