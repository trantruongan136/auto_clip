#!/bin/bash

# AutoClip One-click Start Script
# Version: 2.0
# Function: Start the complete AutoClip system (Backend API + Celery Worker + Frontend UI)

set -euo pipefail

# =============================================================================
# Configuration Area
# =============================================================================

# Service Port Configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
REDIS_PORT=6379

# Service Timeout Configuration
BACKEND_STARTUP_TIMEOUT=60
FRONTEND_STARTUP_TIMEOUT=90
HEALTH_CHECK_TIMEOUT=10

# Log Configuration
LOG_DIR="logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
CELERY_LOG="$LOG_DIR/celery.log"

# PID Files
BACKEND_PID_FILE="backend.pid"
FRONTEND_PID_FILE="frontend.pid"
CELERY_PID_FILE="celery.pid"

# =============================================================================
# Color and Style Definitions
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Icon Definitions
ICON_SUCCESS="✅"
ICON_ERROR="❌"
ICON_WARNING="⚠️"
ICON_INFO="ℹ️"
ICON_ROCKET="🚀"
ICON_GEAR="⚙️"
ICON_DATABASE="🗄️"
ICON_WORKER="👷"
ICON_WEB="🌐"
ICON_HEALTH="💚"

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}${ICON_INFO} $1${NC}"
}

log_success() {
    echo -e "${GREEN}${ICON_SUCCESS} $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}${ICON_WARNING} $1${NC}"
}

log_error() {
    echo -e "${RED}${ICON_ERROR} $1${NC}"
}

log_header() {
    echo -e "\n${PURPLE}${ICON_ROCKET} $1${NC}"
    echo -e "${PURPLE}$(printf '=%.0s' {1..50})${NC}"
}

log_step() {
    echo -e "\n${CYAN}${ICON_GEAR} $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if port is in use
port_in_use() {
    lsof -i ":$1" >/dev/null 2>&1
}

# Wait for service to start
wait_for_service() {
    local url="$1"
    local timeout="$2"
    local service_name="$3"
    
    log_info "Waiting for $service_name to start..."
    
    for i in $(seq 1 "$timeout"); do
        if curl -fsS "$url" >/dev/null 2>&1; then
            log_success "$service_name started"
            return 0
        fi
        sleep 1
    done
    
    log_error "$service_name startup timed out"
    return 1
}

# Check if process is running
process_running() {
    local pid_file="$1"
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            rm -f "$pid_file"
        fi
    fi
    return 1
}

# Stop process
stop_process() {
    local pid_file="$1"
    local service_name="$2"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping $service_name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                log_warning "Force stopping $service_name..."
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$pid_file"
    fi
}

# =============================================================================
# Environment Check Function
# =============================================================================

check_environment() {
    log_header "Environment Check"
    
    # Check operating system
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log_success "macOS system detected"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_success "Linux system detected"
    else
        log_warning "Unrecognized operating system: $OSTYPE"
    fi
    
    # Check required commands
    local required_commands=("python3" "node" "npm" "redis-cli")
    for cmd in "${required_commands[@]}"; do
        if command_exists "$cmd"; then
            log_success "$cmd installed"
        else
            log_error "$cmd not installed, please install it first"
            exit 1
        fi
    done
    
    # Check Python version
    local python_version=$(python3 --version 2>&1 | cut -d' ' -f2)
    log_info "Python version: $python_version"
    
    # Check Node.js version
    local node_version=$(node --version)
    log_info "Node.js version: $node_version"
    
    # Check virtual environment
    if [[ ! -d "venv" ]]; then
        log_error "Virtual environment does not exist, please create it first: python3 -m venv venv"
        exit 1
    fi
    log_success "Virtual environment exists"
    
    # Check project structure
    local required_dirs=("backend" "frontend" "data")
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_success "Directory $dir exists"
        else
            log_error "Directory $dir does not exist"
            exit 1
        fi
    done
}

# =============================================================================
# Service Start Functions
# =============================================================================

start_redis() {
    log_step "Starting Redis service"
    
    if redis-cli ping >/dev/null 2>&1; then
        log_success "Redis service is already running"
        return 0
    fi
    
    log_info "Starting Redis service..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            brew services start redis
            sleep 3
        else
            log_error "Please start Redis service manually"
            exit 1
        fi
    else
        systemctl start redis-server 2>/dev/null || service redis-server start 2>/dev/null || {
            log_error "Unable to start Redis service, please start manually"
            exit 1
        }
    fi
    
    if redis-cli ping >/dev/null 2>&1; then
        log_success "Redis service started successfully"
    else
        log_error "Redis service failed to start"
        exit 1
    fi
}

setup_environment() {
    log_step "Setting up environment"
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    # Activate virtual environment
    log_info "Activating virtual environment..."
    source venv/bin/activate
    
    # Set Python path
    : "${PYTHONPATH:=}"
    export PYTHONPATH="${PWD}:${PYTHONPATH}"
    log_info "Setting Python path: $PYTHONPATH"
    
    # Load environment variables
    if [[ -f ".env" ]]; then
        log_info "Loading environment variables..."
        set -a
        source .env
        set +a
        log_success "Environment variables loaded successfully"
    else
        log_warning ".env file does not exist, using default configuration"
        # Create default environment variable file
        if [[ ! -f ".env" ]]; then
            log_info "Creating default .env file..."
            cp env.example .env 2>/dev/null || {
                cat > .env << EOF
# AutoClip Environment Configuration
DATABASE_URL=sqlite:///./data/autoclip.db
REDIS_URL=redis://localhost:6379/0
API_DASHSCOPE_API_KEY=
API_MODEL_NAME=qwen-plus
LOG_LEVEL=INFO
ENVIRONMENT=development
DEBUG=true
EOF
                log_success "Created default .env file"
            }
        fi
    fi
    
    # Check Python dependencies
    log_info "Checking Python dependencies..."
    if ! python -c "import fastapi, celery, sqlalchemy" 2>/dev/null; then
        log_warning "Missing dependencies, installing..."
        pip install -r requirements.txt
    fi
    log_success "Python dependency check completed"
}

init_database() {
    log_step "Initializing database"
    
    # Ensure data directory exists
    mkdir -p data
    
    # Initialize database
    log_info "Creating database tables..."
    if python -c "
import sys
sys.path.insert(0, '.')
from backend.core.database import engine, Base
from backend.models import project, task, clip, collection, bilibili
try:
    Base.metadata.create_all(bind=engine)
    print('Database tables created successfully')
except Exception as e:
    print(f'Database initialization failed: {e}')
    sys.exit(1)
" 2>/dev/null; then
        log_success "Database initialized successfully"
    else
        log_error "Database initialization failed"
        exit 1
    fi
}

start_celery() {
    log_step "Starting Celery Worker"
    
    # Stop existing Celery processes
    pkill -f "celery.*worker" 2>/dev/null || true
    sleep 2
    
    log_info "Starting Celery Worker..."
    nohup celery -A backend.core.celery_app worker \
        --loglevel=info \
        --concurrency=2 \
        -Q processing,upload,notification,maintenance \
        --hostname=worker@%h \
        > "$CELERY_LOG" 2>&1 &
    
    local celery_pid=$!
    echo "$celery_pid" > "$CELERY_PID_FILE"
    
    # Wait for Worker to start
    sleep 5
    
    if pgrep -f "celery.*worker" >/dev/null; then
        log_success "Celery Worker started (PID: $celery_pid)"
    else
        log_error "Celery Worker failed to start"
        log_info "View logs: tail -f $CELERY_LOG"
        exit 1
    fi
}

start_backend() {
    log_step "Starting Backend API Service"
    
    # Check if port is in use
    if port_in_use "$BACKEND_PORT"; then
        log_warning "Port $BACKEND_PORT is already in use, trying to stop existing service..."
        stop_process "$BACKEND_PID_FILE" "Backend Service"
    fi
    
    log_info "Starting backend service (Port: $BACKEND_PORT)..."
    nohup python -m uvicorn backend.main:app \
        --host 0.0.0.0 \
        --port "$BACKEND_PORT" \
        --reload \
        --reload-dir backend \
        --reload-include '*.py' \
        --reload-exclude 'data/*' \
        --reload-exclude 'logs/*' \
        --reload-exclude 'uploads/*' \
        --reload-exclude '*.log' \
        > "$BACKEND_LOG" 2>&1 &
    
    local backend_pid=$!
    echo "$backend_pid" > "$BACKEND_PID_FILE"
    
    # Wait for backend to start
    if wait_for_service "http://localhost:$BACKEND_PORT/api/v1/health/" "$BACKEND_STARTUP_TIMEOUT" "Backend service"; then
        log_success "Backend service started (PID: $backend_pid)"
    else
        log_error "Backend service failed to start"
        log_info "View logs: tail -f $BACKEND_LOG"
        exit 1
    fi
}

start_frontend() {
    log_step "Starting Frontend Service"
    
    # Check if port is in use
    if port_in_use "$FRONTEND_PORT"; then
        log_warning "Port $FRONTEND_PORT is already in use, trying to stop existing service..."
        stop_process "$FRONTEND_PID_FILE" "Frontend Service"
    fi
    
    # Enter frontend directory
    cd frontend || {
        log_error "Unable to enter frontend directory"
        exit 1
    }
    
    # Check frontend dependencies
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing frontend dependencies..."
        npm install
    fi
    
    log_info "Starting frontend service (Port: $FRONTEND_PORT)..."
    nohup npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT" \
        > "../$FRONTEND_LOG" 2>&1 &
    
    local frontend_pid=$!
    echo "$frontend_pid" > "../$FRONTEND_PID_FILE"
    
    # Return to project root directory
    cd ..
    
    # Wait for frontend to start
    if wait_for_service "http://localhost:$FRONTEND_PORT/" "$FRONTEND_STARTUP_TIMEOUT" "Frontend service"; then
        log_success "Frontend service started (PID: $frontend_pid)"
    else
        log_error "Frontend service failed to start"
        log_info "View logs: tail -f $FRONTEND_LOG"
        exit 1
    fi
}

# =============================================================================
# Health Check Function
# =============================================================================

health_check() {
    log_header "System Health Check"
    
    local all_healthy=true
    
    # Check backend
    log_info "Checking backend service..."
    if curl -fsS "http://localhost:$BACKEND_PORT/api/v1/health/" >/dev/null 2>&1; then
        log_success "Backend service is healthy"
    else
        log_error "Backend service is unhealthy"
        all_healthy=false
    fi
    
    # Check frontend
    log_info "Checking frontend service..."
    if curl -fsS "http://localhost:$FRONTEND_PORT/" >/dev/null 2>&1; then
        log_success "Frontend service is healthy"
    else
        log_error "Frontend service is unhealthy"
        all_healthy=false
    fi
    
    # Check Redis
    log_info "Checking Redis service..."
    if redis-cli ping >/dev/null 2>&1; then
        log_success "Redis service is healthy"
    else
        log_error "Redis service is unhealthy"
        all_healthy=false
    fi
    
    # Check Celery Worker
    log_info "Checking Celery Worker..."
    if pgrep -f "celery.*worker" >/dev/null; then
        log_success "Celery Worker is healthy"
    else
        log_error "Celery Worker is unhealthy"
        all_healthy=false
    fi
    
    if [[ "$all_healthy" == true ]]; then
        log_success "All service health checks passed"
        return 0
    else
        log_error "Some service health checks failed"
        return 1
    fi
}

# =============================================================================
# Cleanup Function
# =============================================================================

cleanup() {
    log_header "Cleaning up services"
    
    stop_process "$BACKEND_PID_FILE" "Backend service"
    stop_process "$FRONTEND_PID_FILE" "Frontend service"
    stop_process "$CELERY_PID_FILE" "Celery Worker"
    
    # Stop all related processes
    pkill -f "celery.*worker" 2>/dev/null || true
    pkill -f "uvicorn.*backend.main:app" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# =============================================================================
# Show System Information
# =============================================================================

show_system_info() {
    log_header "System Startup Complete"
    
    echo -e "${WHITE}🎉 AutoClip system started successfully!${NC}"
    echo ""
    echo -e "${CYAN}📊 Service Status:${NC}"
    echo -e "  ${ICON_WEB} Backend API:    http://localhost:$BACKEND_PORT"
    echo -e "  ${ICON_WEB} Frontend UI:    http://localhost:$FRONTEND_PORT"
    echo -e "  ${ICON_WEB} API Docs:       http://localhost:$BACKEND_PORT/docs"
    echo -e "  ${ICON_HEALTH} Health Check: http://localhost:$BACKEND_PORT/api/v1/health/"
    echo ""
    echo -e "${CYAN}📝 Log Files:${NC}"
    echo -e "  Backend logs: tail -f $BACKEND_LOG"
    echo -e "  Frontend logs: tail -f $FRONTEND_LOG"
    echo -e "  Celery logs: tail -f $CELERY_LOG"
    echo ""
    echo -e "${CYAN}🛑 Stop System:${NC}"
    echo -e "  ./stop_autoclip.sh or press Ctrl+C"
    echo ""
    echo -e "${YELLOW}💡 Usage Instructions:${NC}"
    echo -e "  1. Visit http://localhost:$FRONTEND_PORT to use the frontend interface"
    echo -e "  2. Upload video files or enter Bilibili links"
    echo -e "  3. The system will automatically start the AI processing pipeline"
    echo -e "  4. View processing progress and results in real-time"
    echo ""
}

# =============================================================================
# Signal Handling
# =============================================================================

trap cleanup EXIT INT TERM

# =============================================================================
# Main Function
# =============================================================================

main() {
    log_header "AutoClip System Starter v2.0"
    
    # Environment Check
    check_environment
    
    # Start Services
    start_redis
    setup_environment
    init_database
    start_celery
    start_backend
    start_frontend
    
    # Health Check
    if health_check; then
        show_system_info
        
        # Keep script running
        log_info "System is running... Press Ctrl+C to stop"
        log_info "To check system status, run: ./status_autoclip.sh"
        while true; do
            sleep 3600  # Check once per hour
        done
    else
        log_error "System failed to start, please check logs"
        exit 1
    fi
}

# Run main function
main "$@"
