#!/bin/bash

# =============================================================================
# VedaAI Local Development Startup Script
#
# This script starts all services needed for local development.
# Supports both:
#   1. Dev mode: Docker Redis only (API/web run locally with pnpm)
#   2. Full Docker: All services containerized (Redis, Mongo, API, Worker, Web)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check if Docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
  fi
  print_success "Docker is running"
}

# Check if pnpm is installed
check_pnpm() {
  if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install it first."
    exit 1
  fi
  print_success "pnpm is installed"
}

# Cleanup on exit
cleanup() {
  echo ""
  read -p "Stop Docker services on exit? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Stopping Docker services..."
    if [ "$MODE" == "dev" ]; then
      docker compose -f docker-compose.dev.yml down
    else
      docker compose down
    fi
    print_success "Services stopped"
  fi
}

# Show menu
show_menu() {
  print_header "VedaAI Local Development Mode"
  echo "Choose your development mode:"
  echo ""
  echo "  1) DEV MODE (Recommended for development)"
  echo "     - Docker: Redis only"
  echo "     - Local: API server (port 4000) and Web (port 3000) run with pnpm"
  echo "     - Fast reload: tsx watch for API, Next.js for Web"
  echo ""
  echo "  2) FULL DOCKER (Production-like testing)"
  echo "     - Docker: Redis, MongoDB, API, Worker, Web"
  echo "     - All services containerized"
  echo "     - Slower rebuilds but closer to production"
  echo ""
  read -p "Select mode (1 or 2): " -n 1 -r
  echo

  if [[ $REPLY == "1" ]]; then
    MODE="dev"
  elif [[ $REPLY == "2" ]]; then
    MODE="full"
  else
    print_error "Invalid selection"
    exit 1
  fi
}

# Start dev mode (Docker Redis + local API/Web)
start_dev_mode() {
  print_header "Starting DEV MODE"

  print_info "Starting Docker Redis..."
  docker compose -f docker-compose.dev.yml up -d
  print_success "Redis is running on port 6379"

  print_info "Installing dependencies..."
  pnpm install
  print_success "Dependencies installed"

  print_header "Starting Local Services"
  echo -e "${YELLOW}Opening in new terminal windows...${NC}\n"

  # Check if we're on macOS or Linux
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use open with AppleScript
    osascript <<EOF
tell application "Terminal"
  do script "cd '$SCRIPT_DIR' && echo 'Starting API server (port 4000)...' && pnpm --filter @vedaai/api dev"
end tell
EOF

    sleep 2

    osascript <<EOF
tell application "Terminal"
  do script "cd '$SCRIPT_DIR' && echo 'Starting Web server (port 3000)...' && pnpm --filter @vedaai/web dev"
end tell
EOF

    sleep 2

    osascript <<EOF
tell application "Terminal"
  do script "cd '$SCRIPT_DIR' && echo 'Starting Worker (BullMQ)...' && pnpm --filter @vedaai/worker dev"
end tell
EOF

    print_success "New terminal windows opened"
  else
    # Linux - use gnome-terminal or xterm
    if command -v gnome-terminal &> /dev/null; then
      gnome-terminal -- bash -c "cd '$SCRIPT_DIR' && pnpm --filter @vedaai/api dev; bash"
      sleep 2
      gnome-terminal -- bash -c "cd '$SCRIPT_DIR' && pnpm --filter @vedaai/web dev; bash"
      sleep 2
      gnome-terminal -- bash -c "cd '$SCRIPT_DIR' && pnpm --filter @vedaai/worker dev; bash"
    else
      xterm -e "cd '$SCRIPT_DIR' && pnpm --filter @vedaai/api dev" &
      sleep 2
      xterm -e "cd '$SCRIPT_DIR' && pnpm --filter @vedaai/web dev" &
      sleep 2
      xterm -e "cd '$SCRIPT_DIR' && pnpm --filter @vedaai/worker dev" &
    fi
  fi

  print_header "Dev Mode Ready"
  echo -e "${GREEN}Services running:${NC}"
  echo "  • Redis:     http://localhost:6379"
  echo "  • API:       http://localhost:4000"
  echo "  • Web:       http://localhost:3000"
  echo "  • Worker:    (BullMQ background)"
  echo ""
  echo -e "${YELLOW}Logs are shown in the new terminal windows.${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop any service in its respective terminal.${NC}\n"
}

# Start full Docker mode
start_full_mode() {
  print_header "Starting FULL DOCKER MODE"

  print_info "Building and starting all services..."
  echo "  • Redis"
  echo "  • MongoDB"
  echo "  • API (Express + Socket.IO)"
  echo "  • Worker (BullMQ)"
  echo "  • Web (Next.js)"
  echo ""

  # Create .env file if it doesn't exist with stub values
  if [ ! -f .env ]; then
    print_warning "Creating .env with stub values (for local development)"
    cat > .env << 'EOF'
# Local development stubs — replace with real keys if needed
GEMINI_API_KEY=stub
CLOUDINARY_CLOUD_NAME=stub
CLOUDINARY_API_KEY=stub
CLOUDINARY_API_SECRET=stub
EOF
    print_success "Created .env file"
  fi

  # Start the full stack
  docker compose up --build -d

  print_info "Waiting for services to become healthy..."

  # Wait for each service
  local max_attempts=30
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    if docker compose ps | grep -q "healthy"; then
      break
    fi
    echo -n "."
    sleep 2
    ((attempt++))
  done

  echo ""
  print_success "All services started"

  print_header "Full Docker Mode Ready"
  echo -e "${GREEN}Services running:${NC}"
  echo "  • Redis:     localhost:6379"
  echo "  • MongoDB:   localhost:27017"
  echo "  • API:       http://localhost:4000"
  echo "  • Web:       http://localhost:3000"
  echo "  • Worker:    (background)"
  echo ""
  echo -e "${YELLOW}To view logs:${NC}"
  echo "  docker compose logs -f          # all services"
  echo "  docker compose logs -f api      # API only"
  echo "  docker compose logs -f worker   # Worker only"
  echo "  docker compose logs -f web      # Web only"
  echo ""
  echo -e "${YELLOW}To stop services:${NC}"
  echo "  docker compose down             # stop containers"
  echo "  docker compose down -v          # stop and remove volumes\n"
}

# Main flow
main() {
  print_header "VedaAI Development Environment"

  # Set trap for cleanup
  trap cleanup EXIT

  # Check prerequisites
  check_docker
  check_pnpm

  # Show menu and start selected mode
  show_menu

  if [ "$MODE" == "dev" ]; then
    start_dev_mode
  else
    start_full_mode
  fi

  print_info "Setup complete! Visit http://localhost:3000 to see the app"
  print_warning "Press Ctrl+C when you want to stop\n"

  # Keep script running
  if [ "$MODE" == "full" ]; then
    docker compose logs -f
  else
    # For dev mode, just wait
    wait
  fi
}

# Run main
main "$@"
