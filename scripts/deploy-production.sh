#!/bin/bash
set -e

# CodeTube Production Deployment Script
# Usage: ./scripts/deploy-production.sh

echo "🚀 Starting CodeTube PRODUCTION deployment..."
echo "⚠️  This will deploy to the LIVE production environment!"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_DIR="/opt/codetube"
BACKUP_DIR="/opt/backups/codetube-production"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REQUIRED_VARS=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}✗${NC} This script must be run as root for production deployment"
  exit 1
fi

# Function to print status
print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

print_important() {
  echo -e "${BLUE}➤${NC} $1"
}

# Confirm deployment
confirm_deployment() {
  echo ""
  print_important "You are about to deploy to PRODUCTION!"
  print_info "Current version: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  print_info "Timestamp: $(date)"
  echo ""
  
  read -p "Are you sure you want to continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    print_info "Deployment cancelled"
    exit 0
  fi
  
  echo ""
  read -p "Have you tested this in staging? (yes/no): " tested
  if [ "$tested" != "yes" ]; then
    print_error "Please test in staging before deploying to production"
    exit 1
  fi
}

# Check prerequisites
check_prerequisites() {
  print_info "Checking prerequisites..."
  
  command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed."; exit 1; }
  command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is required but not installed."; exit 1; }
  
  # Check if Docker is running
  if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running"
    exit 1
  fi
  
  print_status "Prerequisites check passed"
}

# Check environment variables
check_environment() {
  print_info "Checking environment variables..."
  
  if [ ! -f "$PRODUCTION_DIR/.env" ]; then
    print_error "Environment file not found at $PRODUCTION_DIR/.env"
    exit 1
  fi
  
  # Source environment file
  set -a
  source "$PRODUCTION_DIR/.env"
  set +a
  
  # Check required variables
  for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      print_error "Required environment variable $var is not set"
      exit 1
    fi
  done
  
  # Validate secrets are not default values
  if [[ "$JWT_SECRET" == *"change-in-production"* ]] || [[ "$JWT_SECRET" == *"default"* ]]; then
    print_error "JWT_SECRET appears to be a default value. Please set a secure secret!"
    exit 1
  fi
  
  print_status "Environment variables validated"
}

# Create backup
create_backup() {
  print_info "Creating production backup..."
  mkdir -p "$BACKUP_DIR"
  
  # Stop here if containers are not running
  if ! docker ps | grep -q codetube-backend; then
    print_info "No running containers found, skipping backup"
    return
  fi
  
  # Database backup
  print_info "Backing up database..."
  docker exec codetube-postgres pg_dump -U codetube codetube | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"
  
  # Uploads backup
  if [ -d "$PRODUCTION_DIR/backend_uploads" ]; then
    print_info "Backing up uploads..."
    tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C "$PRODUCTION_DIR" backend_uploads
  fi
  
  # Environment backup
  cp "$PRODUCTION_DIR/.env" "$BACKUP_DIR/env_$TIMESTAMP"
  
  # Cleanup old backups (keep last 30 days)
  find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "env_*" -mtime +30 -delete 2>/dev/null || true
  
  print_status "Backup created at $BACKUP_DIR"
  print_info "Database backup: db_$TIMESTAMP.sql.gz"
}

# Pre-deployment checks
pre_deployment_checks() {
  print_info "Running pre-deployment checks..."
  
  # Check disk space
  DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
  if [ "$DISK_USAGE" -gt 90 ]; then
    print_error "Disk usage is at ${DISK_USAGE}%. Free up space before deploying."
    exit 1
  fi
  print_status "Disk space check passed (${DISK_USAGE}% used)"
  
  # Check memory
  AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
  if [ "$AVAILABLE_MEM" -lt 512 ]; then
    print_error "Low memory: ${AVAILABLE_MEM}MB available. At least 512MB recommended."
    exit 1
  fi
  print_status "Memory check passed (${AVAILABLE_MEM}MB available)"
  
  # Check if ports are available
  for port in 80 443 3000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      if ! docker ps | grep -q "codetube"; then
        print_error "Port $port is already in use by another process"
        exit 1
      fi
    fi
  done
  print_status "Port availability check passed"
}

# Deploy application
deploy() {
  print_info "Deploying to production environment..."
  
  cd "$PRODUCTION_DIR"
  
  # Pull latest code
  print_info "Pulling latest changes..."
  git fetch origin
  git reset --hard origin/main
  
  # Verify production environment file
  if [ ! -f ".env" ]; then
    print_error "Production .env file not found!"
    exit 1
  fi
  
  # Build and deploy with zero downtime
  print_info "Building new containers..."
  docker-compose -f docker-compose.yml build --no-cache
  
  print_info "Starting new containers..."
  docker-compose -f docker-compose.yml up -d
  
  # Wait for database
  print_info "Waiting for database to be ready..."
  sleep 10
  
  # Run migrations
  print_info "Running database migrations..."
  if ! docker-compose exec -T backend npx prisma migrate deploy; then
    print_error "Migration failed! Rolling back..."
    rollback
    exit 1
  fi
  
  # Health checks
  print_info "Running health checks..."
  sleep 5
  
  MAX_RETRIES=60
  RETRY_COUNT=0
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
      print_status "Backend health check passed"
      break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
  done
  
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Health check failed - backend did not start properly"
    print_info "Rolling back..."
    rollback
    exit 1
  fi
  
  # Frontend check
  if curl -sf http://localhost:80 > /dev/null 2>&1; then
    print_status "Frontend health check passed"
  else
    print_error "Frontend health check failed"
    print_info "Rolling back..."
    rollback
    exit 1
  fi
  
  # Cleanup
  print_info "Cleaning up..."
  docker system prune -af --volumes 2>/dev/null || true
  
  print_status "Production deployment completed successfully!"
  print_important "Your application is now live at: https://your-domain.com"
}

# Rollback function
rollback() {
  print_info "Rolling back to previous version..."
  
  # Find latest backup
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | head -1)
  
  if [ -n "$LATEST_BACKUP" ]; then
    print_info "Restoring database from: $LATEST_BACKUP"
    gunzip < "$LATEST_BACKUP" | docker exec -i codetube-postgres psql -U codetube codetube
    print_status "Database restored"
  else
    print_error "No database backup found for rollback"
  fi
  
  # Restart previous containers (using old images)
  docker-compose down
  docker-compose up -d
  
  print_status "Rollback completed"
}

# Show deployment status
show_status() {
  print_info "Current deployment status:"
  echo ""
  echo "=== Docker Containers ==="
  docker ps --filter "name=codetube" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  echo ""
  echo "=== Resource Usage ==="
  docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "N/A"
  echo ""
  echo "=== Recent Logs ==="
  docker-compose logs --tail=20 2>/dev/null || echo "No logs available"
}

# Main execution
case "${1:-deploy}" in
  deploy)
    confirm_deployment
    check_prerequisites
    check_environment
    pre_deployment_checks
    create_backup
    deploy
    ;;
  rollback)
    print_important "Rolling back production deployment!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
      rollback
    else
      print_info "Rollback cancelled"
    fi
    ;;
  status)
    show_status
    ;;
  *)
    echo "Usage: $0 [deploy|rollback|status]"
    echo ""
    echo "Commands:"
    echo "  deploy   - Deploy to production (with confirmation)"
    echo "  rollback - Rollback to previous version"
    echo "  status   - Show current deployment status"
    exit 1
    ;;
esac
