# Inventory Store - VPS Deployment Guide

This guide will help you deploy the Inventory Store application to a VPS (Virtual Private Server).

## Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+ (recommended: Ubuntu 22.04)
- **RAM**: Minimum 2GB (recommended: 4GB+)
- **Storage**: Minimum 20GB (recommended: 50GB+)
- **CPU**: 1 vCPU (recommended: 2+ vCPUs)

### Required Software
- Docker (latest version)
- Docker Compose (latest version)
- Git
- Nginx (optional, for reverse proxy)

## Quick Deployment

### 1. Prepare Your VPS

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group changes
```

### 2. Clone and Setup Application

```bash
# Clone the repository
git clone https://github.com/rugvedaitech-png/INVENTORY-STORE.git
cd INVENTORY-STORE/apps/web

# Create environment file
cp .env.production.example .env
nano .env  # Edit with your configuration
```

### 3. Configure Environment Variables

Edit the `.env` file with your production values:

```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MYSQL_DATABASE=inventory_store
MYSQL_USER=inventory_user
MYSQL_PASSWORD=your_secure_password_here

# Application URL (update with your domain)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_very_long_random_secret_key_here

# Email Configuration
RESEND_API_KEY=your_resend_api_key_here

# Payment Configuration (optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_ENABLED=true
```

**Important**: Generate a strong secret key:
```bash
openssl rand -base64 32
```

### 4. Deploy Application

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 5. Configure Domain (Optional)

If you have a domain name, configure it to point to your VPS IP address.

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Start Services

```bash
# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps
```

### 2. Initialize Database

```bash
# Run database migrations
docker-compose exec app npx prisma db push

# Seed database (optional)
docker-compose exec app npm run db:seed
```

### 3. Verify Deployment

```bash
# Check application logs
docker-compose logs -f app

# Check if application is accessible
curl http://localhost:3000
```

## Production Configuration

### SSL/HTTPS Setup

1. **Using Let's Encrypt (Recommended)**:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

2. **Using Docker with SSL**:

```bash
# Update docker-compose.yml to include SSL volumes
# Place your SSL certificates in ./ssl/ directory
```

### Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD inventory_store > backup_$DATE.sql
EOF

chmod +x backup.sh

# Schedule daily backups
echo "0 2 * * * /path/to/backup.sh" | sudo crontab -
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check database connection
docker-compose exec app npx prisma db status
```

### Log Management

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f mysql

# View nginx logs
docker-compose logs -f nginx
```

### Updates

```bash
# Update application
git pull origin main
docker-compose down
docker-compose up --build -d

# Update database schema (if needed)
docker-compose exec app npx prisma db push
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   sudo netstat -tulpn | grep :3000
   sudo kill -9 <PID>
   ```

2. **Database Connection Issues**:
   ```bash
   # Check database logs
   docker-compose logs mysql
   
   # Restart database
   docker-compose restart mysql
   ```

3. **Permission Issues**:
   ```bash
   # Fix upload directory permissions
   sudo chown -R 1001:1001 public/uploads
   ```

4. **Memory Issues**:
   ```bash
   # Check memory usage
   docker stats
   
   # Increase swap if needed
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### Performance Optimization

1. **Enable Gzip Compression** (already configured in nginx.conf)
2. **Set up Redis for caching** (optional)
3. **Use CDN for static assets** (optional)
4. **Configure database indexes** (already configured in Prisma schema)

## Security Considerations

1. **Change default passwords** in .env file
2. **Use strong secret keys** for NEXTAUTH_SECRET
3. **Enable firewall** and only open necessary ports
4. **Regular security updates** for the VPS
5. **Database backups** and test restore procedures
6. **SSL certificates** for HTTPS
7. **Rate limiting** (already configured in nginx.conf)

## Support

If you encounter any issues during deployment:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure all required ports are open
4. Check VPS resources (RAM, disk space)

For additional support, please refer to the project documentation or create an issue in the repository.
