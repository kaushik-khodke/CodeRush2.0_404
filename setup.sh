#!/usr/bin/env bash
# SMOA Mission Control - Automated Environment Setup Script
# Works on Linux, macOS, and WSL

set -e

echo "======================================================================"
echo "🚀 SMOA SPACECRAFT MISSION CONTROL - AUTOMATED SYSTEM SETUP"
echo "======================================================================"

# 1. Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not installed."
    exit 1
fi

echo "📦 Setting up Python virtual environment..."
python3 -m venv .venv || python -m venv .venv
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true

echo "📥 Installing Backend Python dependencies..."
pip install --upgrade pip
pip install -r Backend/requirements.txt pytest pytest-asyncio

# 2. Check Node.js installation
if ! command -v npm &> /dev/null; then
    echo "❌ Error: Node.js / npm is required but not installed."
    exit 1
fi

echo "📦 Installing Frontend Node.js dependencies..."
cd Frontend
npm install
cd ..

echo "======================================================================"
echo "✅ SETUP COMPLETE! To run the full system, execute:"
echo "   python start_all.py  OR  bash start.sh"
echo "======================================================================"
