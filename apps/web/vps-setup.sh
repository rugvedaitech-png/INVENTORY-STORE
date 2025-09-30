#!/bin/bash

# VPS Setup Script for ordernestpro.rugvedaitech.com
# Run this script on your VPS after connecting via SSH

set -e

echo "🚀 Setting up Inventory Store on VPS..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

print_status "Installing required software..."

# Update system
apt update && apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    print_status "Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    print_status "Docker Compose already installed"
fi

# Install Git
if ! command -v git &> /dev/null; then
    print_status "Installing Git..."
    apt install git -y
else
    print_status "Git already installed"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    apt install nginx -y
else
    print_status "Nginx already installed"
fi

# Create application directory
print_status "Creating application directory..."
mkdir -p /opt/inventory-store
cd /opt/inventory-store

# Clone repository
if [ ! -d ".git" ]; then
    print_status "Cloning repository..."
    git clone https://github.com/rugvedaitech-png/INVENTORY-STORE.git .
else
    print_status "Repository already exists, pulling latest changes..."
    git pull origin main
fi

# Navigate to web app
cd apps/web

# Create environment file
print_status "Creating environment configuration..."
cat > .env << 'EOF'
# Production Environment Configuration for ordernestpro.rugvedaitech.com
# Database Configuration
MYSQL_ROOT_PASSWORD=inventory_secure_root_2024
MYSQL_DATABASE=inventory_store
MYSQL_USER=inventory_user
MYSQL_PASSWORD=inventory_secure_password_2024

# Application URL
NEXTAUTH_URL=https://ordernestpro.rugvedaitech.com
NEXTAUTH_SECRET=inventory_nextauth_secret_key_2024_very_long_random_string

# Email Configuration (update with your actual keys)
RESEND_API_KEY=your_resend_api_key_here

# Payment Configuration (update with your actual keys)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_ENABLED=true
EOF

# Generate strong secret
print_status "Generating strong secret key..."
SECRET=$(openssl rand -base64 32)
sed -i "s/inventory_nextauth_secret_key_2024_very_long_random_string/$SECRET/" .env

# Create necessary directories
print_status "Creating upload directories..."
mkdir -p public/uploads/categories
mkdir -p public/uploads/products
chmod 755 public/uploads/categories
chmod 755 public/uploads/products

# Deploy application
print_status "Deploying application..."
chmod +x deploy.sh
./deploy.sh

# Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/inventory-store << 'EOF'
server {
    listen 80;
    server_name ordernestpro.rugvedaitech.com www.ordernestpro.rugvedaitech.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Client max body size for file uploads
    client_max_body_size 10M;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/inventory-store /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Configure firewall
print_status "Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

print_status "✅ VPS setup completed!"
print_status ""
print_status "Your application is now running at:"
print_status "  HTTP: http://ordernestpro.rugvedaitech.com"
print_status ""
print_status "Next steps:"
print_status "1. Update API keys in .env file:"
print_status "   nano /opt/inventory-store/apps/web/.env"
print_status ""
print_status "2. Setup SSL certificate:"
print_status "   apt install certbot python3-certbot-nginx -y"
print_status "   certbot --nginx -d ordernestpro.rugvedaitech.com"
print_status ""
print_status "3. Check application status:"
print_status "   cd /opt/inventory-store/apps/web"
print_status "   docker-compose ps"
print_status "   docker-compose logs -f"
print_status ""
print_status "4. Access your application:"
print_status "   Open http://ordernestpro.rugvedaitech.com in your browser"
