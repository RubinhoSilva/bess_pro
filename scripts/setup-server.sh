#!/bin/bash

# BESS-Pro Server Setup Script
# Run this on your EC2 instance as ubuntu user

set -e

echo "🔧 Setting up BESS-Pro production server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Update system
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
log_info "Installing Docker..."
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install docker-ce -y
sudo usermod -aG docker ubuntu

# Install Docker Compose
log_info "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
log_info "Installing Nginx..."
sudo apt install nginx -y

# Install other utilities
log_info "Installing utilities..."
sudo apt install git curl htop ufw fail2ban -y

# Configure firewall
log_info "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Configure fail2ban
log_info "Configuring fail2ban..."
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Create swap file (if not exists)
if [ ! -f /swapfile ]; then
    log_info "Creating swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Configure log rotation
log_info "Setting up log rotation..."
sudo tee /etc/logrotate.d/bess-pro << EOF
/home/ubuntu/bess-pro/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        docker-compose -f /home/ubuntu/bess-pro/docker-compose.prod.yml restart backend 2>/dev/null || true
    endscript
}
EOF

# Create directories
log_info "Creating application directories..."
mkdir -p /home/ubuntu/bess-pro
mkdir -p /home/ubuntu/backups
mkdir -p /home/ubuntu/logs

# Set up crontab for backups
log_info "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/bess-pro/scripts/backup.sh") | crontab -

# Configure Nginx
log_info "Configuring Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default

# Copy nginx config when project is cloned
# sudo ln -sf /home/ubuntu/bess-pro/nginx/bess-pro.conf /etc/nginx/sites-enabled/

# Test Nginx config
# sudo nginx -t && sudo systemctl reload nginx

log_success "Server setup completed! 🎉"

echo ""
echo "📝 Next steps:"
echo "  1. Logout and login again to apply Docker group changes"
echo "  2. Run the deployment script: ./scripts/deploy.sh"
echo "  3. Configure your domain DNS"
echo "  4. Set up SSL with Let's Encrypt"

echo ""
echo "🔍 Verification commands:"
echo "  docker --version"
echo "  docker-compose --version"
echo "  nginx -v"
echo "  sudo ufw status"

echo ""
log_warning "Remember to:"
echo "  - Change default passwords"
echo "  - Configure monitoring"
echo "  - Set up regular backups"
echo "  - Review security settings"