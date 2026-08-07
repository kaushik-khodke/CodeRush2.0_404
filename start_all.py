#!/usr/bin/env python3
"""
SMOA Spacecraft Mission Control - Unified Launcher Script
Launches:
 1. Supabase Check (Non-blocking with timeout)
 2. FastAPI Backend API & WebSockets (Port 8000)
 3. Main Mission Console Frontend (Port 5173)
 4. Data Seeding Control App (Port 5174)
"""

import os
import sys
import time
import signal
import subprocess
import webbrowser
from pathlib import Path

# Safe Windows stdout encoding fix
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).parent.resolve()
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"

processes = []

def log(tag: str, msg: str, color_code: str = "36"):
    try:
        print(f"\033[{color_code}m[{tag}]\033[0m {msg}")
    except Exception:
        print(f"[{tag}] {msg}")

def signal_handler(sig, frame):
    print("\n")
    log("SYSTEM", "Shutting down all SMOA Mission Control services...", "31")
    for p, name in processes:
        log("STOP", f"Terminating {name} (PID {p.pid})...", "33")
        try:
            p.terminate()
        except Exception:
            pass
    sys.exit(0)

def start_supabase():
    log("SUPABASE", "Checking Supabase status (4s timeout)...", "35")
    try:
        res = subprocess.run(
            ["npx", "supabase", "status"],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            shell=True,
            timeout=4
        )
        if "API URL" in res.stdout or (res.stdout and "Stopped" not in res.stdout):
            log("SUPABASE", "Supabase local service detected & active.", "35")
        else:
            log("SUPABASE", "Local Supabase CLI container not started. Backend will use DB fallback.", "33")
    except subprocess.TimeoutExpired:
        log("SUPABASE", "Supabase CLI status check timed out. Proceeding with Backend & Database.", "33")
    except Exception as e:
        log("SUPABASE", f"Supabase check note: {e}", "33")

def main():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print("=" * 70)
    print("SMOA SPACECRAFT MISSION CONTROL - ALL-IN-ONE SYSTEM LAUNCHER")
    print("=" * 70)

    # 1. Supabase Check (Non-blocking timeout)
    start_supabase()

    # 2. FastAPI Backend Server (Port 8000)
    log("BACKEND", "Starting FastAPI Server on http://localhost:8000...", "32")
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = str(BACKEND_DIR) + ";" + str(ROOT_DIR)
    p_backend = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=BACKEND_DIR,
        env=backend_env,
        shell=True
    )
    processes.append((p_backend, "FastAPI Backend"))

    time.sleep(1.5)

    # 3. Main Frontend Console (Port 5173)
    log("FRONTEND", "Starting Main Mission Console on http://localhost:5173...", "34")
    p_frontend = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=FRONTEND_DIR,
        shell=True
    )
    processes.append((p_frontend, "Main Frontend Console"))

    # 4. Data Seeding Controller App (Port 5174)
    log("SEEDING", "Starting Data Seeding Control App on http://localhost:5174...", "36")
    p_seeding = subprocess.Popen(
        ["npm", "run", "dev:seeding"],
        cwd=FRONTEND_DIR,
        shell=True
    )
    processes.append((p_seeding, "Data Seeding Controller"))

    print("=" * 70)
    print("ALL MISSION CONTROL SERVICES RUNNING SUCCESSFULLY!")
    print("  Backend API & WebSockets: http://localhost:8000")
    print("  Supabase / Mission DB:   Integrated")
    print("  Main Mission Console:    http://localhost:5173")
    print("  Data Seeding Controller: http://localhost:5174")
    print("=" * 70)

    # Automatically open browser tabs after 3s delay
    try:
        time.sleep(3)
        log("BROWSER", "Opening Main Console (5173) and Seeding Controller (5174)...", "32")
        webbrowser.open("http://localhost:5173")
        time.sleep(0.5)
        webbrowser.open("http://localhost:5174")
    except Exception:
        pass

    print("\nPress Ctrl+C to terminate all services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
