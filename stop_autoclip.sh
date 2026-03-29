#!/bin/bash

# AutoClip Stop Script
# Version: 2.0
# Function: Gracefully stop all AutoClip services

set -euo pipefail

# =============================================================================
# Configuration Area
# =============================================================================

# PID Files
BACKEND_PID_FILE="backend.pid"
FRONTEND_PID_FILE="frontend.pid"
CELERY_PID_FILE="celery.pid"

# Log Directory
LOG_DIR="logs"

# =============================================================================
# Color and Style Definitions
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Icon Definitions
ICON_SUCCESS="✅"
ICON_ERROR="❌"
ICON_WARNING="⚠️"
ICON_INFO="ℹ️"
ICON_STOP="🛑"
ICON_CLEAN="🧹"

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
    echo -e "\n${PURPLE}${ICON_STOP} $1${NC}"
    echo -e "${PURPLE}$(printf '=%.0s' {1..50})${NC}"
}

# Stop process
stop_process() {
    local pid_file="$1"
    local service_name="$2"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping $service_name (PID: $pid)..."
            
            # Graceful stop
            kill "$pid" 2>/dev/null || true
            
            # Wait for process to end
            local count=0
            while kill -0 "$pid" 2>/dev/null && [[ $count -lt 10 ]]; do
                sleep 1
                ((count++))
            done
            
            # If process is still running, force stop
            if kill -0 "$pid" 2>/dev/null; then
                log_warning "Force stopping $service_name..."
                kill -9 "$pid" 2>/dev/null || true
                sleep 1
            fi
            
            if kill -0 "$pid" 2>/dev/null; then
                log_error "Could not stop $service_name"
            else
                log_success "$service_name has been stopped"
            fi
        else
            log_warning "$service_name process does not exist"
        fi
        rm -f "$pid_file"
    else
        log_info "$service_name PID file does not exist"
    fi
}

# Stop all related processes
stop_all_processes() {
    log_header "Stopping all AutoClip services"
    
    # Stop processes managed by PID files
    stop_process "$BACKEND_PID_FILE" "Backend Service"
    stop_process "$FRONTEND_PID_FILE" "Frontend Service"
    stop_process "$CELERY_PID_FILE" "Celery Worker"
    
    # Stop all related processes
    log_info "Stopping all Celery Worker processes..."
    pkill -f "celery.*worker" 2>/dev/null || true
    
    log_info "Stopping all Backend API processes..."
    pkill -f "uvicorn.*backend.main:app" 2>/dev/null || true
    
    log_info "Stopping all Frontend development servers..."
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    # Wait for processes to completely stop
    sleep 2
    
    log_success "All services have been stopped"
}

# Clean temporary files
cleanup_temp_files() {
    log_header "Cleaning up temporary files"
    
    # Clean PID files
    rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE" "$CELERY_PID_FILE"
    log_success "PID files cleaned up"
    
    # Clean Celery temp files
    rm -f /tmp/celerybeat-schedule /tmp/celerybeat.pid 2>/dev/null || true
    log_success "Celery temp files cleaned up"
    
    # Clean Python cache
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true
    log_success "Python cache cleaned up"
}

# Show system status
show_system_status() {
    log_header "System Status Check"
    
    local services_running=false
    
    # Check backend service
    if pgrep -f "uvicorn.*backend.main:app" >/dev/null; then
        log_warning "Backend service is still running"
        services_running=true
    else
        log_success "Backend service is stopped"
    fi
    
    # Check frontend service
    if pgrep -f "npm.*dev\|vite" >/dev/null; then
        log_warning "Frontend service is still running"
        services_running=true
    else
        log_success "Frontend service is stopped"
    fi
    
    # Check Celery Worker
    if pgrep -f "celery.*worker" >/dev/null; then
        log_warning "Celery Worker is still running"
        services_running=true
    else
        log_success "Celery Worker is stopped"
    fi
    
    if [[ "$services_running" == true ]]; then
        log_warning "Some services are still running, manual stop might be needed"
        echo ""
        echo "Processes still running:"
        pgrep -f "uvicorn.*backend.main:app\|npm.*dev\|vite\|celery.*worker" | while read pid; do
            ps -p "$pid" -o pid,ppid,cmd --no-headers 2>/dev/null || true
        done
    else
        log_success "All AutoClip services stopped completely"
    fi
}

# Show log info
show_log_info() {
    log_header "Log File Information"
    
    if [[ -d "$LOG_DIR" ]]; then
        echo "Log file locations:"
        ls -la "$LOG_DIR"/*.log 2>/dev/null | while read line; do
            echo "  $line"
        done
        echo ""
        echo "View latest logs:"
        echo "  Backend logs: tail -f $LOG_DIR/backend.log"
        echo "  Frontend logs: tail -f $LOG_DIR/frontend.log"
        echo "  Celery logs: tail -f $LOG_DIR/celery.log"
    else
        log_info "Log directory does not exist"
    fi
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    log_header "AutoClip System Stopper v2.0"
    
    # Stop all services
    stop_all_processes
    
    # Clean temp files
    cleanup_temp_files
    
    # Show system status
    show_system_status
    
    # Show log info
    show_log_info
    
    echo ""
    log_success "AutoClip System has been completely stopped"
    echo ""
    echo "To start again, run: ./start_autoclip.sh"
}

# Run main function
main "$@"
