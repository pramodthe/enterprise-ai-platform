#!/bin/bash
set -e

echo "Starting Enterprise AI backend..."

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
else
  source .venv/bin/activate
fi

echo "Starting FastAPI (http://0.0.0.0:8000)..."
python main.py
