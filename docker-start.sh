#!/bin/bash

# AutoClip Docker Start Script
# Version: 1.0
# Function: Use Docker to quickly start AutoClip system

set -euo pipefail

# =============================================================================
# Configuration Area
# =============================================================================

# Color Definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Icon Definitions
ICON_SUCCESS="✅"
ICON_ERROR="❌"
ICON_WARNING="⚠️"
ICON_INFO="ℹ️"
ICON_ROCKET="🚀"
ICON_DOCKER="🐳"

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

# =============================================================================
# Check Functions
# =============================================================================

check_docker() {
    log_header "Checking Docker environment"
    
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    log_success "Docker is installed"
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    log_success "Docker Compose is installed"
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker service is not running. Please start Docker service."
        exit 1
    fi
    log_success "Docker service is running normally"
}

check_environment() {
    log_header "Checking environment configuration"
    
    if [[ ! -f ".env" ]]; then
        log_warning ".env file does not exist, creating default configuration..."
        if [[ -f "env.example" ]]; then
            cp env.example .env
            log_success "Created default .env file"
            log_warning "Please edit .env file to fill in necessary configurations (especially API keys)"
        else
            log_error "env.example file does not exist"
            exit 1
        fi
    else
        log_success ".env file exists"
    fi
    
    # Check necessary configurations
    if ! grep -q "API_DASHSCOPE_API_KEY" .env || grep -q "API_DASHSCOPE_API_KEY=$" .env; then
        log_warning "API_DASHSCOPE_API_KEY is not configured, AI functions will not be available"
    fi
}

check_ports() {
    log_header "Checking port availability"
    
    local ports=(8000 3000 6379 5555)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -i ":$port" >/dev/null 2>&1; then
            occupied_ports+=("$port")
        fi
    done
    
    if [[ ${#occupied_ports[@]} -gt 0 ]]; then
        log_warning "The following ports are occupied: ${occupied_ports[*]}"
        log_info "Docker will automatically handle port conflicts, but it's recommended to stop services occupying these ports"
    else
        log_success "All ports available"
    fi
}

# =============================================================================
# Start Functions
# =============================================================================

start_services() {
    log_header "Starting AutoClip services"
    
    # Choose start mode
    if [[ "${1:-}" == "dev" ]]; then
        log_info "Starting development environment..."
        docker-compose -f docker-compose.dev.yml up -d
        COMPOSE_FILE="docker-compose.dev.yml"
    else
        log_info "Starting production environment..."
        docker-compose up -d
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 10
    
    # Check service status
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_success "Services started successfully"
    else
        log_error "Services failed to start"
        log_info "View logs: docker-compose -f $COMPOSE_FILE logs"
        exit 1
    fi
}

show_status() {
    log_header "Service status"
    
    echo -e "${CYAN}📊 Container status:${NC}"
    docker-compose ps
    
    echo -e "\n${CYAN}🌐 Access addresses:${NC}"
    echo -e "  Frontend UI: http://localhost:3000"
    echo -e "  Backend API: http://localhost:8000"
    echo -e "  API Docs: http://localhost:8000/docs"
    echo -e "  Flower Monitor: http://localhost:5555"
    
    echo -e "\n${CYAN}📝 Common commands:${NC}"
    echo -e "  View logs: docker-compose logs -f"
    echo -e "  Stop services: docker-compose down"
    echo -e "  Restart services: docker-compose restart"
    echo -e "  Enter container: docker-compose exec autoclip bash"
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    log_header "AutoClip Docker Starter v1.0"
    
    # Parse parameters
    local mode="production"
    if [[ "${1:-}" == "dev" ]]; then
        mode="development"
    fi
    
    log_info "Startup mode: $mode"
    
    # Execute checks
    check_docker
    check_environment
    check_ports
    
    # Start services
    start_services "$mode"
    
    # Show status
    show_status
    
    echo -e "\n${WHITE}🎉 AutoClip Docker deployment complete!${NC}"
    echo -e "${YELLOW}💡 Tip: First startup may take a few minutes to download and build images${NC}"
}

# Show help information
show_help() {
    echo "AutoClip Docker Start Script"
    echo ""
    echo "Usage:"
    echo "  $0 [options]"
    echo ""
    echo "Options:"
    echo "  dev     Start development environment"
    echo "  help    Show help information"
    echo ""
    echo "Examples:"
    echo "  $0          # Start production environment"
    echo "  $0 dev      # Start development environment"
    echo "  $0 help     # Show help information"
}

# Process parameters
case "${1:-}" in
    "help"|"-h"|"--help")
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
