#!/bin/bash

# BESS-Pro Backup Script
# Run daily via cron

set -e

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
PROJECT_DIR="/home/ubuntu/bess-pro"
DATE=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Create backup directory
mkdir -p $BACKUP_DIR

log_info "Starting backup process..."

# Backup MongoDB
log_info "Backing up MongoDB..."
docker exec bess-pro-mongodb mongodump --out /tmp/mongo-backup-$DATE 2>/dev/null || true
docker cp bess-pro-mongodb:/tmp/mongo-backup-$DATE $BACKUP_DIR/ 2>/dev/null || true
docker exec bess-pro-mongodb rm -rf /tmp/mongo-backup-$DATE 2>/dev/null || true

# Backup Redis (if needed)
log_info "Backing up Redis..."
docker exec bess-pro-redis redis-cli BGSAVE > /dev/null 2>&1 || true
docker cp bess-pro-redis:/data/dump.rdb $BACKUP_DIR/redis-backup-$DATE.rdb 2>/dev/null || true

# Backup uploaded files
log_info "Backing up uploaded files..."
if docker volume ls | grep -q bess-pro_uploads; then
    docker run --rm -v bess-pro_uploads:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads-backup-$DATE.tar.gz -C /data . 2>/dev/null || true
fi

# Backup application code and configs
log_info "Backing up application files..."
tar -czf $BACKUP_DIR/app-backup-$DATE.tar.gz -C $(dirname $PROJECT_DIR) $(basename $PROJECT_DIR) 2>/dev/null || true

# Create a combined backup
log_info "Creating combined backup..."
cd $BACKUP_DIR
tar -czf "bess-pro-full-backup-$DATE.tar.gz" \
    mongo-backup-$DATE/ \
    redis-backup-$DATE.rdb \
    uploads-backup-$DATE.tar.gz \
    app-backup-$DATE.tar.gz 2>/dev/null || true

# Clean up individual backups
rm -rf mongo-backup-$DATE/ 2>/dev/null || true
rm -f redis-backup-$DATE.rdb 2>/dev/null || true
rm -f uploads-backup-$DATE.tar.gz 2>/dev/null || true
rm -f app-backup-$DATE.tar.gz 2>/dev/null || true

# Clean up old backups
log_info "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "bess-pro-full-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/bess-pro-full-backup-$DATE.tar.gz" 2>/dev/null | cut -f1 || echo "unknown")

log_success "Backup completed successfully!"
log_info "Backup file: bess-pro-full-backup-$DATE.tar.gz"
log_info "Backup size: $BACKUP_SIZE"

# Optional: Upload to S3 (uncomment and configure)
# aws s3 cp "$BACKUP_DIR/bess-pro-full-backup-$DATE.tar.gz" s3://your-backup-bucket/

# Log to system
logger "BESS-Pro backup completed: bess-pro-full-backup-$DATE.tar.gz ($BACKUP_SIZE)"