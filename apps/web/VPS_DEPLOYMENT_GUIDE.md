# VPS Deployment Guide for ordernestpro.rugvedaitech.com

## Your VPS Details
- **IP Address**: 66.116.199.29
- **Domain**: ordernestpro.rugvedaitech.com
- **Status**: Running (NVMe 4 VPS)

## Quick Deployment Steps

### Step 1: Connect to Your VPS

```bash
# Connect via SSH (replace 'root' with your username if different)
ssh root@66.116.199.29

# If you don't have SSH access, use the VNC access from BigRock panel
```

### Step 2: Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt install git -y

# Install Nginx (for reverse proxy)
apt install nginx -y
```

### Step 3: Clone Your Repository

```bash
# Create application directory
mkdir -p /opt/inventory-store
cd /opt/inventory-store

# Clone your repository
git clone https://github.com/rugvedaitech-png/INVENTORY-STORE.git .

# Navigate to web app
cd apps/web
```

### Step 4: Configure Environment

```bash
# Create production environment file
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

# Email Configuration (get from Resend.com)
RESEND_API_KEY=your_resend_api_key_here

# Payment Configuration (get from Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_ENABLED=true
EOF

# Generate a strong secret key
openssl rand -base64 32
# Copy the output and replace NEXTAUTH_SECRET in .env file
```

### Step 5: Deploy with Docker

```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy the application
./deploy.sh
```

### Step 6: Configure Nginx (Optional but Recommended)

```bash
# Create Nginx configuration
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

# Enable the site
ln -s /etc/nginx/sites-available/inventory-store /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx
```

### Step 7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d ordernestpro.rugvedaitech.com -d www.ordernestpro.rugvedaitech.com

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### Step 8: Configure Firewall

```bash
# Allow necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

## Verification

### Check Application Status

```bash
# Check Docker containers
docker-compose ps

# Check application logs
docker-compose logs -f app

# Check if application is accessible
curl http://localhost:3000
curl https://ordernestpro.rugvedaitech.com
```

### Test Database Connection

```bash
# Connect to MySQL
docker-compose exec mysql mysql -u root -p

# Check if database exists
SHOW DATABASES;
USE inventory_store;
SHOW TABLES;
```

## Management Commands

### Start/Stop Services

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Backup Database

```bash
# Create backup
docker-compose exec mysql mysqldump -u root -p inventory_store > backup_$(date +%Y%m%d_%H%M%S).sql

# Schedule daily backups
echo "0 2 * * * cd /opt/inventory-store/apps/web && docker-compose exec mysql mysqldump -u root -p inventory_store > backup_\$(date +\%Y\%m\%d_\%H\%M\%S).sql" | crontab -
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**:
   ```bash
   sudo netstat -tulpn | grep :3000
   sudo kill -9 <PID>
   ```

2. **Database connection issues**:
   ```bash
   docker-compose logs mysql
   docker-compose restart mysql
   ```

3. **Permission issues**:
   ```bash
   sudo chown -R 1001:1001 public/uploads
   ```

4. **SSL certificate issues**:
   ```bash
   certbot certificates
   certbot renew --dry-run
   ```

### Logs Location

- Application logs: `docker-compose logs -f app`
- Database logs: `docker-compose logs -f mysql`
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`

## Security Checklist

- [ ] Changed default passwords in .env
- [ ] Generated strong NEXTAUTH_SECRET
- [ ] Configured firewall (ports 22, 80, 443 only)
- [ ] Setup SSL certificate
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] File upload permissions set correctly

## Access Your Application

Once deployed, your application will be available at:
- **HTTP**: http://ordernestpro.rugvedaitech.com
- **HTTPS**: https://ordernestpro.rugvedaitech.com (after SSL setup)

## Support

If you encounter any issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure all required ports are open
4. Check VPS resources (RAM, disk space)

The application includes:
- Customer interface for shopping
- Seller interface for inventory management
- Supplier interface for purchase orders
- Order management and tracking
- Payment processing
- User authentication and roles
