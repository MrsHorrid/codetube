#!/bin/bash
set -e

# CodeTube Staging Deployment Script
# Usage: ./scripts/deploy-staging.sh

echo "🚀 Starting CodeTube staging deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_DIR="/opt/codetube-staging"
BACKUP_DIR="/opt/backups/codetube-staging"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if running as root for system-wide deployment
if [ "$EUID" -ne 0 ] && [ -z "$SKIP_ROOT_CHECK" ]; then 
  echo -e "${YELLOW}⚠️  Warning: Not running as root. Some operations may fail.${NC}"
  echo "Set SKIP_ROOT_CHECK=1 to skip this warning."
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

# Check prerequisites
check_prerequisites() {
  print_info "Checking prerequisites..."
  
  command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed."; exit 1; }
  command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is required but not installed."; exit 1; }
  
  print_status "Prerequisites check passed"
}

# Create backup
create_backup() {
  if [ -d "$STAGING_DIR" ]; then
    print_info "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker ps | grep -q codetube-postgres; then
      docker exec codetube-postgres pg_dump -U codetube codetube > "$BACKUP_DIR/db_$TIMESTAMP.sql" 2>/dev/null || true
    fi
    
    # Backup uploads
    if [ -d "$STAGING_DIR/backend_uploads" ]; then
      tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C "$STAGING_DIR" backend_uploads 2>/dev/null || true
    fi
    
    # Cleanup old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    
    print_status "Backup created at $BACKUP_DIR"
  fi
}

# Deploy application
deploy() {
  print_info "Deploying to staging environment..."
  
  # Create staging directory
  mkdir -p "$STAGING_DIR"
  cd "$STAGING_DIR"
  
  # Clone or pull latest code
  if [ -d ".git" ]; then
    print_info "Pulling latest changes..."
    git fetch origin
    git reset --hard origin/main
  else
    print_info "Cloning repository..."
    # Update this with your actual repository URL
    git clone https://github.com/yourusername/codetube.git .
  fi
  
  # Create environment file if it doesn't exist
  if [ ! -f ".env" ]; then
    print_info "Creating environment file..."
    cat > .env << EOL
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://codetube:changeme@postgres:5432/codetube?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=staging-jwt-secret-$(openssl rand -hex 16)
JWT_REFRESH_SECRET=staging-refresh-secret-$(openssl rand -hex 16)
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
POSTGRES_USER=codetube
POSTGRES_PASSWORD=changeme
POSTGRES_DB=codetube
EOL
    print_info "Please update the .env file with your actual credentials!"
  fi
  
  # Build and start containers
  print_info "Building and starting containers..."
  docker-compose -f docker-compose.yml pull
  docker-compose -f docker-compose.yml build --no-cache
  docker-compose -f docker-compose.yml up -d
  
  # Wait for database to be ready
  print_info "Waiting for database..."
  sleep 10
  
  # Run migrations
  print_info "Running database migrations..."
  docker-compose exec -T backend npx prisma migrate deploy || {
    print_error "Migration failed, but deployment may still be functional"
  }
  
  # Health check
  print_info "Performing health check..."
  sleep 5
  
  MAX_RETRIES=30
  RETRY_COUNT=0
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
      print_status "Backend is healthy"
      break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
  done
  
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Health check failed - backend did not start properly"
    exit 1
  fi
  
  # Cleanup
  print_info "Cleaning up..."
  docker system prune -f
  
  print_status "Deployment completed successfully!"
  print_info "Staging URL: http://localhost"
  print_info "API URL: http://localhost:3000"
}

# Rollback function
rollback() {
  print_info "Rolling back to previous version..."
  
  if [ -f "$BACKUP_DIR/db_$TIMESTAMP.sql" ]; then
    docker exec -i codetube-postgres psql -U codetube codetube < "$BACKUP_DIR/db_$TIMESTAMP.sql"
    print_status "Database restored"
  fi
  
  # Restart previous containers
  docker-compose down
  docker-compose up -d
  
  print_status "Rollback completed"
}

# Main execution
case "${1:-deploy}" in
  deploy)
    check_prerequisites
    create_backup
    deploy
    ;;
  rollback)
    rollback
    ;;
  *)
    echo "Usage: $0 [deploy|rollback]"
    exit 1
    ;;
esac
