#!/bin/bash

# AutoClip Quick Start Script
# Version: 2.0
# Function: Quickly start development environment, skipping detailed checks

set -euo pipefail

# =============================================================================
# Configuration Area
# =============================================================================

BACKEND_PORT=8000
FRONTEND_PORT=3000

# =============================================================================
# Color Definitions
# =============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    echo -e "${GREEN}🚀 AutoClip Quick Start${NC}"
    echo ""
    
    # Check virtual environment
    if [[ ! -d "venv" ]]; then
        log_warning "Virtual environment does not exist, please run first: python3 -m venv venv"
        exit 1
    fi
    
    # Activate virtual environment
    log_info "Activating virtual environment..."
    source venv/bin/activate
    
    # Set Python path
    : "${PYTHONPATH:=}"
    export PYTHONPATH="${PWD}:${PYTHONPATH}"
    
    # Load environment variables
    if [[ -f ".env" ]]; then
        set -a
        source .env
        set +a
    fi
    
    # Start Redis (if needed)
    if ! redis-cli ping >/dev/null 2>&1; then
        log_info "Starting Redis..."
        if command -v brew >/dev/null; then
            brew services start redis
            sleep 2
        fi
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Start backend
    log_info "Starting backend service..."
    nohup python -m uvicorn backend.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload > logs/backend.log 2>&1 &
    echo $! > backend.pid
    
    # Start Celery Worker
    log_info "Starting Celery Worker..."
    nohup celery -A backend.core.celery_app worker --loglevel=info --concurrency=2 -Q processing,upload,notification,maintenance > logs/celery.log 2>&1 &
    echo $! > celery.pid
    
    # Start frontend
    log_info "Starting frontend service..."
    cd frontend
    nohup npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT" > ../logs/frontend.log 2>&1 &
    echo $! > ../frontend.pid
    cd ..
    
    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 5
    
    # Check services status
    if curl -fsS "http://localhost:$BACKEND_PORT/api/v1/health/" >/dev/null 2>&1; then
        log_success "Backend service started"
    else
        log_warning "Backend service might have problems starting"
    fi
    
    if curl -fsS "http://localhost:$FRONTEND_PORT/" >/dev/null 2>&1; then
        log_success "Frontend service started"
    else
        log_warning "Frontend service might have problems starting"
    fi
    
    echo ""
    log_success "Quick start complete!"
    echo ""
    echo "🌐 Access addresses:"
    echo "  Frontend: http://localhost:$FRONTEND_PORT"
    echo "  Backend: http://localhost:$BACKEND_PORT"
    echo "  API Docs: http://localhost:$BACKEND_PORT/docs"
    echo ""
    echo "📝 View Logs:"
    echo "  tail -f logs/backend.log"
    echo "  tail -f logs/frontend.log"
    echo "  tail -f logs/celery.log"
    echo ""
    echo "🛑 Stop services: ./stop_autoclip.sh"
}

# Run main function
main "$@"
