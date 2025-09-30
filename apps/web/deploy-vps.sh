#!/bin/bash

# VPS Deployment Script for ordernestpro.rugvedaitech.com
# IP: 66.116.199.29

set -e

echo "🚀 Deploying Inventory Store to VPS (ordernestpro.rugvedaitech.com)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# VPS Configuration
VPS_IP="66.116.199.29"
DOMAIN="ordernestpro.rugvedaitech.com"
APP_DIR="/opt/inventory-store"

print_step "1. Preparing VPS connection..."
print_status "VPS IP: $VPS_IP"
print_status "Domain: $DOMAIN"

# Check if we can connect to VPS
print_step "2. Testing VPS connection..."
if ! ping -c 1 $VPS_IP > /dev/null 2>&1; then
    print_error "Cannot reach VPS at $VPS_IP"
    print_status "Please ensure your VPS is running and accessible"
    exit 1
fi
print_status "VPS is reachable"

print_step "3. Creating deployment package..."

# Create deployment directory
mkdir -p deployment-package
cd deployment-package

# Copy application files
print_status "Copying application files..."
cp -r ../src .
cp -r ../public .
cp -r ../prisma .
cp ../package.json .
cp ../package-lock.json .
cp ../next.config.ts .
cp ../tsconfig.json .
cp ../postcss.config.mjs .
cp ../tailwind.config.js .
cp ../vitest.config.ts .
cp ../Dockerfile .
cp ../docker-compose.yml .
cp ../nginx.conf .
cp ../deploy.sh .

# Create production environment file
print_status "Creating production environment file..."
cat > .env << EOF
# Production Environment Configuration for $DOMAIN
# Database Configuration
MYSQL_ROOT_PASSWORD=inventory_secure_root_2024
MYSQL_DATABASE=inventory_store
MYSQL_USER=inventory_user
MYSQL_PASSWORD=inventory_secure_password_2024

# Application URL
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=inventory_nextauth_secret_key_2024_very_long_random_string

# Email Configuration (update with your actual keys)
RESEND_API_KEY=your_resend_api_key_here

# Payment Configuration (update with your actual keys)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_ENABLED=true
EOF

# Create deployment instructions
print_status "Creating deployment instructions..."
cat > DEPLOY_INSTRUCTIONS.md << EOF
# VPS Deployment Instructions

## VPS Details
- IP: $VPS_IP
- Domain: $DOMAIN
- App Directory: $APP_DIR

## Step 1: Connect to VPS
\`\`\`bash
ssh root@$VPS_IP
# or
ssh your_username@$VPS_IP
\`\`\`

## Step 2: Install Docker (if not already installed)
\`\`\`bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
\`\`\`

## Step 3: Upload Files
Upload this entire directory to your VPS:
\`\`\`bash
# From your local machine
scp -r deployment-package/* root@$VPS_IP:$APP_DIR/
\`\`\`

## Step 4: Deploy Application
\`\`\`bash
# On VPS
cd $APP_DIR
chmod +x deploy.sh
./deploy.sh
\`\`\`

## Step 5: Configure Domain
Your domain should already be pointing to $VPS_IP. If not, add these DNS records:
- A record: @ -> $VPS_IP
- A record: www -> $VPS_IP
- A record: * -> $VPS_IP

## Step 6: Access Application
- HTTP: http://$DOMAIN
- HTTPS: https://$DOMAIN (after SSL setup)

## Useful Commands
\`\`\`bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update application
git pull && docker-compose up --build -d
\`\`\`
EOF

print_step "4. Creating upload script..."
cat > upload-to-vps.sh << 'EOF'
#!/bin/bash
echo "📤 Uploading files to VPS..."
echo "Please run this command:"
echo "scp -r deployment-package/* root@66.116.199.29:/opt/inventory-store/"
echo ""
echo "Or if you prefer rsync:"
echo "rsync -avz deployment-package/ root@66.116.199.29:/opt/inventory-store/"
EOF

chmod +x upload-to-vps.sh

print_step "5. Deployment package ready!"
print_status "Deployment package created in: deployment-package/"
print_status "Files included:"
ls -la

print_status ""
print_status "Next steps:"
print_status "1. Review and update .env file with your actual API keys"
print_status "2. Upload files to VPS using the upload script"
print_status "3. SSH into your VPS and run the deployment"
print_status ""
print_status "Upload command:"
print_warning "scp -r deployment-package/* root@$VPS_IP:/opt/inventory-store/"
print_status ""
print_status "SSH command:"
print_warning "ssh root@$VPS_IP"
print_status ""
print_status "Deployment command (on VPS):"
print_warning "cd /opt/inventory-store && chmod +x deploy.sh && ./deploy.sh"

cd ..
print_status "✅ Deployment package created successfully!"
