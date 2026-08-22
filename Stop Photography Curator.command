#!/bin/bash
# Double-click to stop only the local Photography Curator for this repository.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd -P)"
cd "$ROOT"

PID_FILE="$ROOT/.curator.pid"
URL="http://127.0.0.1:3000/admin"
PORT=3000
stopped=0

pause_exit() {
  local code="${1:-0}"
  echo
  echo "Press Return to close this window."
  read -r _ || true
  exit "$code"
}

pid_is_live() {
  local pid="${1:-}"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
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

stop_pid_tree() {
  local pid="${1:-}"
  if ! pid_is_live "$pid"; then
    return 0
  fi
  echo "Stopping process $pid"
  kill_tree "$pid" TERM
  sleep 0.6
  if pid_is_live "$pid"; then
    kill_tree "$pid" KILL
  fi
  stopped=1
}

proc_cwd() {
  local pid="${1:-}"
  local out
  out="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null || true)"
  printf '%s\n' "$out" | sed -n 's/^n//p' | sed -n '1p'
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

is_this_repo_curator() {
  local pid="${1:-}"
  local cwd
  if ! pid_is_live "$pid"; then
    return 1
  fi
  cwd="$(proc_cwd "$pid" || true)"
  if [ "$cwd" != "$ROOT" ]; then
    return 1
  fi
  if ps eww -p "$pid" 2>/dev/null | grep -q "CURATOR=1"; then
    return 0
  fi
  if [ "$(http_code)" = "200" ]; then
    return 0
  fi
  return 1
}

echo "Stop Photography Curator"
echo "Repository: $ROOT"
echo

if [ -f "$PID_FILE" ]; then
  existing="$(tr -d '[:space:]' < "$PID_FILE" || true)"
  if pid_is_live "$existing"; then
    stop_pid_tree "$existing"
  else
    echo "Found a leftover curator pid file; removing it."
  fi
  rm -f "$PID_FILE"
fi

for listen_pid in $(lsof -nP -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true); do
  if is_this_repo_curator "$listen_pid"; then
    parent="$(ps -o ppid= -p "$listen_pid" 2>/dev/null | tr -d ' ' || true)"
    if [ -n "$parent" ] && is_this_repo_curator "$parent"; then
      stop_pid_tree "$parent"
    else
      stop_pid_tree "$listen_pid"
    fi
  fi
done

sleep 0.3

if [ "$(http_code)" = "200" ]; then
  echo "The curator at $URL is still responding."
  echo "It may belong to another window or another copy of this project."
  pause_exit 1
fi

if [ "$stopped" = "1" ]; then
  echo "Photography Curator has been stopped."
else
  echo "Photography Curator was not running."
fi

pause_exit 0
