#!/bin/bash
# Double-click to start the local Photography Curator in your browser.
# Binds 127.0.0.1 only (same as `npm run curate`). Leave this window open.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd -P)"
cd "$ROOT"

PID_FILE="$ROOT/.curator.pid"
URL="http://127.0.0.1:3000/admin"
PORT=3000
npm_pid=""
owned=0

pause_exit() {
  local code="${1:-1}"
  echo
  echo "Press Return to close this window."
  read -r _ || true
  exit "$code"
}

kill_tree() {
  local pid="${1:-}"
  local signal="${2:-TERM}"
  local child
  if [ -z "$pid" ]; then
    return 0
  fi
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child" "$signal"
  done
  kill -s "$signal" "$pid" 2>/dev/null || true
}

stop_owned() {
  if [ "$owned" = "1" ] && pid_is_live "$npm_pid"; then
    kill_tree "$npm_pid" TERM
    sleep 0.4
    if pid_is_live "$npm_pid"; then
      kill_tree "$npm_pid" KILL
    fi
  fi
  if [ "$owned" = "1" ]; then
    rm -f "$PID_FILE"
  fi
}

load_node() {
  export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin:${PATH}"

  set +u
  if [ -z "${NVM_DIR:-}" ]; then
    export NVM_DIR="$HOME/.nvm"
  fi
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # nvm.sh is not safe with `set -u`.
    . "$NVM_DIR/nvm.sh"
  fi
  if command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env --shell bash 2>/dev/null)" || true
  fi
  if [ -s "$HOME/.asdf/asdf.sh" ]; then
    . "$HOME/.asdf/asdf.sh"
  fi
  set -u

  if [ -d "$HOME/.volta/bin" ]; then
    export PATH="$HOME/.volta/bin:$PATH"
  fi
}

http_code() {
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 1 --max-time 2 "$URL" 2>/dev/null || true)"
  if [ -z "$code" ]; then
    echo "000"
  else
    echo "$code"
  fi
}

port_pids() {
  lsof -nP -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
}

pid_is_live() {
  local pid="${1:-}"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

wait_for_admin() {
  local i
  for i in $(seq 1 90); do
    if [ "$(http_code)" = "200" ]; then
      return 0
    fi
    sleep 1
  done
  return 1
}

open_admin() {
  echo "Opening $URL"
  open "$URL"
}

echo "Photography Curator"
echo "Repository: $ROOT"
echo

load_node

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js / npm was not found."
  echo "Install Node from https://nodejs.org (LTS), then double-click this file again."
  pause_exit 1
fi

if [ ! -d "$ROOT/node_modules" ]; then
  echo "Project dependencies are missing."
  echo "Open Terminal, run:  cd \"$ROOT\" && npm install"
  echo "Then double-click this file again."
  pause_exit 1
fi

if [ -f "$PID_FILE" ]; then
  existing="$(tr -d '[:space:]' < "$PID_FILE" || true)"
  if pid_is_live "$existing"; then
    echo "Photography Curator is already running."
    if wait_for_admin; then
      open_admin
    else
      echo "The existing curator did not become ready in time."
      echo "Try Stop Photography Curator.command, then start again."
      pause_exit 1
    fi
    pause_exit 0
  fi
  rm -f "$PID_FILE"
fi

if [ -n "$(port_pids)" ]; then
  if [ "$(http_code)" = "200" ]; then
    echo "Photography Curator is already running."
    open_admin
    pause_exit 0
  fi
  echo "Port $PORT is already in use by another local program."
  echo "That is not this Photography Curator (http://127.0.0.1:$PORT/admin is not ready)."
  echo "Stop that other server, then double-click this file again."
  pause_exit 1
fi

echo "Starting local curator on 127.0.0.1:$PORT …"
echo "Leave this window open while you work."
echo "When you are finished, double-click Stop Photography Curator.command"
echo

npm run curate &
npm_pid=$!
owned=1
echo "$npm_pid" > "$PID_FILE"
trap 'stop_owned; exit 130' INT TERM

if ! pid_is_live "$npm_pid"; then
  wait "$npm_pid" || true
  echo "The curator failed to start."
  stop_owned
  owned=0
  pause_exit 1
fi

if ! wait_for_admin; then
  echo "The curator started but http://127.0.0.1:$PORT/admin did not become ready."
  echo "See the messages above, or use Stop Photography Curator.command and try again."
  stop_owned
  owned=0
  pause_exit 1
fi

open_admin
echo "Ready. Curate in the browser, then Save."
echo

wait "$npm_pid" || true
trap - INT TERM
owned=0
rm -f "$PID_FILE"
echo
echo "Photography Curator has stopped."
pause_exit 0
