#!/bin/bash
# HistoryMaP Services Startup Script
# Usage: ./scripts/start-services.sh [stop|start|restart|status]

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_PID_FILE="$BACKEND_DIR/logs/.backend.pid"
FRONTEND_PID_FILE="$FRONTEND_DIR/logs/.frontend.pid"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

start_backend() {
    log "Starting backend server..."
    cd "$BACKEND_DIR"
    nohup python3 app.py > logs/backend_output.txt 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    log "Backend started with PID $(cat $BACKEND_PID_FILE)"
}

start_frontend() {
    log "Starting frontend server..."
    cd "$FRONTEND_DIR"
    node server.js &
    echo $! > "$FRONTEND_PID_FILE"
    log "Frontend started with PID $(cat $FRONTEND_PID_FILE)"
}

stop_backend() {
    if [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        log "Stopping backend (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
        rm -f "$BACKEND_PID_FILE"
        sleep 1
    fi
}

stop_frontend() {
    if [ -f "$FRONTEND_PID_FILE" ]; then
        PID=$(cat "$FRONTEND_PID_FILE")
        log "Stopping frontend (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
        rm -f "$FRONTEND_PID_FILE"
        sleep 1
    fi
}

status() {
    echo ""
    echo "=== HistoryMaP Service Status ==="
    
    if pgrep -f "python.*app.py" > /dev/null 2>&1; then
        PID=$(pgrep -o "python.*app.py" | head -1)
        echo "[RUNNING] Backend (PID: $PID)"
    else
        echo "[STOPPED] Backend"
    fi
    
    if pgrep -f "node server.js" > /dev/null 2>&1; then
        PID=$(pgrep -o "node server.js" | head -1)
        echo "[RUNNING] Frontend (PID: $PID)"
    else
        echo "[STOPPED] Frontend"
    fi
    
    echo ""
}

case "${1:-start}" in
    start)
        stop_backend
        stop_frontend
        sleep 2
        start_backend
        start_frontend
        ;;
    stop)
        stop_backend
        stop_frontend
        log "All services stopped"
        ;;
    restart)
        status
        read -p "Press Enter to stop and restart... " 
        stop_services=true
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
