#!/bin/bash

# BESS-Pro ARM64 Server Setup Script for t4g instances
# Run this on your EC2 t4g instance as ubuntu user

set -e

echo "🔧 Setting up BESS-Pro production server on ARM64 (t4g)..."

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

# Check if running on ARM64
ARCH=$(uname -m)
if [ "$ARCH" != "aarch64" ]; then
    log_error "This script is designed for ARM64 (aarch64) architecture. Detected: $ARCH"
    exit 1
fi

log_info "Detected ARM64 architecture: $ARCH"

# Update system
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker for ARM64
log_info "Installing Docker for ARM64..."
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Add Docker's official GPG key for ARM64
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository for ARM64
echo "deb [arch=arm64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y
sudo usermod -aG docker ubuntu

# Install Docker Compose for ARM64
log_info "Installing Docker Compose for ARM64..."
DOCKER_COMPOSE_VERSION="v2.24.0"
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-aarch64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify Docker Compose installation
if /usr/local/bin/docker-compose --version; then
    log_success "Docker Compose installed successfully"
else
    log_error "Docker Compose installation failed"
    exit 1
fi

# Install Nginx
log_info "Installing Nginx..."
sudo apt install nginx -y

# Install other utilities
log_info "Installing utilities..."
sudo apt install git curl htop ufw fail2ban -y

# Install Node.js for ARM64 (optional, for local development)
log_info "Installing Node.js for ARM64..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

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

# Optimize for ARM64 - adjust kernel parameters
log_info "Optimizing kernel parameters for ARM64..."
sudo tee -a /etc/sysctl.conf << EOF

# ARM64 optimizations
vm.swappiness=10
vm.vfs_cache_pressure=50
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.tcp_rmem=4096 65536 134217728
net.ipv4.tcp_wmem=4096 65536 134217728
EOF

sudo sysctl -p

# Create swap file optimized for ARM64
if [ ! -f /swapfile ]; then
    log_info "Creating optimized swap file for ARM64..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Configure Docker for ARM64 optimizations
log_info "Configuring Docker for ARM64..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "experimental": true,
  "features": {
    "buildkit": true
  }
}
EOF

sudo systemctl restart docker

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

# Install monitoring tools for ARM64
log_info "Installing monitoring tools..."
sudo apt install htop iotop nethogs -y

# Configure memory limits for containers on ARM64
log_info "Setting up container memory limits..."
sudo tee /etc/systemd/system/docker.service.d/override.conf << EOF
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd --default-ulimit nofile=65536:65536
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker

log_success "ARM64 server setup completed! 🎉"

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
echo "  uname -m  # Should show aarch64"

echo ""
echo "⚡ ARM64 Specific optimizations applied:"
echo "  - Docker configured for ARM64"
echo "  - Kernel parameters optimized"
echo "  - Memory limits configured"
echo "  - BuildKit enabled for faster builds"

echo ""
log_warning "ARM64 specific notes:"
echo "  - Some Docker images may take longer to build initially"
echo "  - Ensure all base images support ARM64"
echo "  - Monitor memory usage closely on t4g instances"
echo "  - Use multi-arch builds for better compatibility"