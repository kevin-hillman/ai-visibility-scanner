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
#     kill "$(cat .dev/backend.pid)"   # verify with: ps -p "$(cat .dev/backend.pid)" -o command=
#     kill "$(cat .dev/frontend.pid)"  # verify with: ps -p "$(cat .dev/frontend.pid)" -o command=
#   If the pid files are stale, use lsof to find the listener and kill that pid:
#     lsof -nP -iTCP:8000 -sTCP:LISTEN
#     lsof -nP -iTCP:3000 -sTCP:LISTEN
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

pid_running() {
  local pid="$1"
  kill -0 "$pid" >/dev/null 2>&1
}

pid_command() {
  local pid="$1"
  ps -p "$pid" -o command= 2>/dev/null | sed 's/^ *//' || true
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
    port_owner "$BACKEND_PORT" | sed 's/^/  /'
  else
    print -r -- "backend: not listening on :$BACKEND_PORT"
  fi
  if [[ -f "$BACKEND_PID" ]]; then
    local backend_pid
    backend_pid="$(<"$BACKEND_PID")"
    if [[ -n "$backend_pid" ]] && pid_running "$backend_pid"; then
      print -r -- "backend pid: $backend_pid"
      print -r -- "  $(pid_command "$backend_pid")"
    else
      print -r -- "backend pid: $backend_pid (stale)"
    fi
  fi

  if is_port_listening "$FRONTEND_PORT"; then
    print -r -- "frontend: listening on :$FRONTEND_PORT"
    port_owner "$FRONTEND_PORT" | sed 's/^/  /'
  else
    print -r -- "frontend: not listening on :$FRONTEND_PORT"
  fi
  if [[ -f "$FRONTEND_PID" ]]; then
    local frontend_pid
    frontend_pid="$(<"$FRONTEND_PID")"
    if [[ -n "$frontend_pid" ]] && pid_running "$frontend_pid"; then
      print -r -- "frontend pid: $frontend_pid"
      print -r -- "  $(pid_command "$frontend_pid")"
    else
      print -r -- "frontend pid: $frontend_pid (stale)"
    fi
  fi
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
