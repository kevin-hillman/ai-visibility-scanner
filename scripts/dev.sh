#!/usr/bin/env zsh
# Start local dev servers (backend + frontend) and write logs to .dev/.
#
# Usage:
#   ./scripts/dev.sh            # start (idempotent)
#   ./scripts/dev.sh status     # show what's listening + last known pids
#   ./scripts/dev.sh logs       # tail logs (Ctrl-C to exit)
#
# Ports (override via env):
#   BACKEND_PORT=8000
#   FRONTEND_PORT=3000
#
# Notes:
# - This script never kills processes.
# - If a port is already in use, that service is skipped.
# - To stop a server you started with this script, kill its pid manually:
#     kill "$(cat .dev/backend.pid)"
#     kill "$(cat .dev/frontend.pid)"
# - Logs are appended to:
#     .dev/backend.log
#     .dev/frontend.log
#
# Prereqs:
# - Backend venv installed:
#     cd backend
#     ./venv/bin/python -m pip install -r requirements.txt
# - Frontend deps installed:
#     cd frontend
#     npm install

set -euo pipefail

REPO_ROOT="${0:A:h:h}" # scripts/dev.sh -> repo root
LOG_DIR="$REPO_ROOT/.dev"
mkdir -p "$LOG_DIR"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PID="$LOG_DIR/backend.pid"
FRONTEND_PID="$LOG_DIR/frontend.pid"

is_port_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

port_owner() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | sed -n '1,5p' || true
}

start_backend() {
  if is_port_listening "$BACKEND_PORT"; then
    print -r -- "backend: port $BACKEND_PORT already in use; skipping."
    port_owner "$BACKEND_PORT" | sed 's/^/  /'
    return 0
  fi

  if [[ ! -x "$REPO_ROOT/backend/venv/bin/python" ]]; then
    print -r -- "backend: missing backend/venv/bin/python; skipping."
    print -r -- "  Setup: cd backend && ./venv/bin/python -m pip install -r requirements.txt"
    return 0
  fi

  print -r -- "\n[$(date '+%Y-%m-%d %H:%M:%S')] starting backend on :$BACKEND_PORT" >> "$BACKEND_LOG"
  (
    cd "$REPO_ROOT/backend"
    nohup ./venv/bin/python -m uvicorn app.main:app --reload --port "$BACKEND_PORT" \
      >> "$BACKEND_LOG" 2>&1 < /dev/null &
    print -r -- "$!" > "$BACKEND_PID"
  )
  print -r -- "backend: started (pid $(<"$BACKEND_PID")) -> $BACKEND_LOG"
}

start_frontend() {
  if is_port_listening "$FRONTEND_PORT"; then
    print -r -- "frontend: port $FRONTEND_PORT already in use; skipping."
    port_owner "$FRONTEND_PORT" | sed 's/^/  /'
    return 0
  fi

  if [[ ! -f "$REPO_ROOT/frontend/package.json" ]]; then
    print -r -- "frontend: missing frontend/package.json; skipping."
    return 0
  fi

  if ! command -v npm >/dev/null 2>&1; then
    print -r -- "frontend: npm not found in PATH; skipping."
    return 0
  fi

  print -r -- "\n[$(date '+%Y-%m-%d %H:%M:%S')] starting frontend on :$FRONTEND_PORT" >> "$FRONTEND_LOG"
  (
    cd "$REPO_ROOT/frontend"
    PORT="$FRONTEND_PORT" nohup npm run dev -- -p "$FRONTEND_PORT" >> "$FRONTEND_LOG" 2>&1 < /dev/null &
    print -r -- "$!" > "$FRONTEND_PID"
  )
  print -r -- "frontend: started (pid $(<"$FRONTEND_PID")) -> $FRONTEND_LOG"
}

show_status() {
  print -r -- "repo: $REPO_ROOT"
  print -r -- "logs: $LOG_DIR"

  if is_port_listening "$BACKEND_PORT"; then
    print -r -- "backend: listening on :$BACKEND_PORT"
  else
    print -r -- "backend: not listening on :$BACKEND_PORT"
  fi
  [[ -f "$BACKEND_PID" ]] && print -r -- "backend pid: $(<"$BACKEND_PID")"

  if is_port_listening "$FRONTEND_PORT"; then
    print -r -- "frontend: listening on :$FRONTEND_PORT"
  else
    print -r -- "frontend: not listening on :$FRONTEND_PORT"
  fi
  [[ -f "$FRONTEND_PID" ]] && print -r -- "frontend pid: $(<"$FRONTEND_PID")"
}

tail_logs() {
  touch "$BACKEND_LOG" "$FRONTEND_LOG"
  print -r -- "Tailing logs (Ctrl-C to exit):"
  print -r -- "  $BACKEND_LOG"
  print -r -- "  $FRONTEND_LOG"
  tail -n 200 -f "$BACKEND_LOG" "$FRONTEND_LOG"
}

case "${1:-start}" in
  start)
    start_backend
    start_frontend
    show_status
    print -r -- "tip: ./scripts/dev.sh logs"
    ;;
  status)
    show_status
    ;;
  logs|log|tail)
    tail_logs
    ;;
  *)
    print -r -- "Usage: $0 [start|status|logs]"
    exit 2
    ;;
esac
