#!/bin/bash

# BESS-Pro Production Deploy Script for ARM64
# Usage: ./scripts/deploy.sh

set -e  # Exit on error

echo "🚀 Starting BESS-Pro deployment on ARM64..."

# Check architecture
ARCH=$(uname -m)
if [ "$ARCH" = "aarch64" ]; then
    echo "✅ Detected ARM64 architecture"
    export DOCKER_DEFAULT_PLATFORM=linux/arm64
else
    echo "⚠️  Warning: Not running on ARM64. Detected: $ARCH"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/ubuntu/bess-pro"
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +"%Y%m%d_%H%M%S")

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    log_error "This script should be run as ubuntu user"
    exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup current deployment
if [ -d "$PROJECT_DIR" ]; then
    log_info "Creating backup of current deployment..."
    tar -czf "$BACKUP_DIR/bess-pro-backup-$DATE.tar.gz" -C "$(dirname $PROJECT_DIR)" "$(basename $PROJECT_DIR)" 2>/dev/null || true
    log_success "Backup created: bess-pro-backup-$DATE.tar.gz"
fi

# Clone or pull latest code
if [ ! -d "$PROJECT_DIR" ]; then
    log_info "Cloning repository..."
    git clone https://github.com/your-username/bess-pro.git $PROJECT_DIR
else
    log_info "Pulling latest changes..."
    cd $PROJECT_DIR
    git pull origin master
fi

cd $PROJECT_DIR

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    log_warning ".env.production not found. Creating from template..."
    cp .env.production.example .env.production 2>/dev/null || true
    log_warning "Please edit .env.production with your production settings"
    read -p "Press enter to continue after editing .env.production..."
fi

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Remove old images to free space (optional)
log_info "Cleaning up old Docker images..."
docker image prune -f 2>/dev/null || true

# Build and start new containers for ARM64
log_info "Building and starting containers for ARM64..."
DOCKER_DEFAULT_PLATFORM=linux/arm64 docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
log_info "Waiting for services to start..."
sleep 30

# Check if services are running
log_info "Checking service health..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    log_success "Services are running!"
else
    log_error "Some services failed to start"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

# Test API health
log_info "Testing API health..."
if curl -f http://localhost:8010/api/v1/health >/dev/null 2>&1; then
    log_success "API is healthy!"
else
    log_warning "API health check failed, but containers are running"
fi

# Clean up old backups (keep last 5)
log_info "Cleaning up old backups..."
cd $BACKUP_DIR
ls -t bess-pro-backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

log_success "Deployment completed successfully! 🎉"
log_info "Application should be available at: http://your-domain.com"
log_info "API health: http://your-domain.com/api/v1/health"

echo ""
echo "📊 Container Status:"
docker-compose -f $PROJECT_DIR/docker-compose.prod.yml ps

echo ""
echo "📝 Next steps:"
echo "  1. Configure your domain DNS to point to this server"
echo "  2. Set up SSL certificate with Let's Encrypt"
echo "  3. Configure monitoring and backups"
echo "  4. Review logs: docker-compose -f docker-compose.prod.yml logs -f"