# VPS Deployment Commands

## Quick Deployment Steps

### 1. SSH into your VPS
```bash
ssh user@your-vps-ip
# or
ssh user@your-domain.com
```

### 2. Navigate to your project directory
```bash
cd /path/to/inventory-store
# Example: cd ~/inventory-store or cd /var/www/inventory-store
```

### 3. Pull latest changes from repository
```bash
git pull origin main
```

### 4. Navigate to web app directory
```bash
cd apps/web
```

### 5. Install/Update dependencies (if needed)
```bash
npm install
# or if using yarn
yarn install
```

### 6. Build the application
```bash
npm run build
# or
yarn build
```

### 7. Restart the application

#### Option A: Using PM2 (Recommended)
```bash
# If PM2 is not installed
npm install -g pm2

# Restart the application
pm2 restart inventory-store
# or if using a different name
pm2 restart all

# Check status
pm2 status

# View logs
pm2 logs inventory-store
```

#### Option B: Using systemd
```bash
sudo systemctl restart inventory-store
# or
sudo systemctl restart nextjs-app

# Check status
sudo systemctl status inventory-store
```

#### Option C: Manual restart (if running directly)
```bash
# Stop current process (find and kill)
pkill -f "next start"
# or
killall node

# Start in background
nohup npm start > app.log 2>&1 &
```

### 8. Verify deployment
```bash
# Check if the app is running
curl http://localhost:3000
# or check your domain
curl https://your-domain.com
```

---

## Complete Deployment Script

Save this as `deploy.sh` on your VPS:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment...${NC}"

# Navigate to project directory
cd /path/to/inventory-store || exit 1

# Pull latest changes
echo -e "${GREEN}Pulling latest changes...${NC}"
git pull origin main

# Navigate to web app
cd apps/web || exit 1

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

# Build application
echo -e "${GREEN}Building application...${NC}"
npm run build

# Restart PM2 process
echo -e "${GREEN}Restarting application...${NC}"
pm2 restart inventory-store

# Show status
echo -e "${GREEN}Deployment complete!${NC}"
pm2 status
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run it:
```bash
./deploy.sh
```

---

## Environment Variables Setup

Make sure your `.env` or `.env.local` file is configured on the VPS:

```bash
# Navigate to web app directory
cd apps/web

# Create or edit .env.local
nano .env.local
# or
vim .env.local
```

Required environment variables:
```env
DATABASE_URL="mysql://user:password@localhost:3306/inventory"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
# Add other required variables
```

---

## Database Migration (if needed)

If you have Prisma schema changes:

```bash
cd apps/web
npx prisma migrate deploy
# or
npx prisma generate
npx prisma migrate deploy
```

---

## Nginx Configuration (if using reverse proxy)

Example Nginx config at `/etc/nginx/sites-available/inventory-store`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Troubleshooting Commands

### Check application logs
```bash
# PM2 logs
pm2 logs inventory-store

# systemd logs
sudo journalctl -u inventory-store -f

# Direct logs
tail -f apps/web/app.log
```

### Check if port is in use
```bash
sudo netstat -tulpn | grep :3000
# or
sudo lsof -i :3000
```

### Check Node.js version
```bash
node -v
npm -v
```

### Restart everything
```bash
# Stop
pm2 stop all
# or
sudo systemctl stop inventory-store

# Start
pm2 start all
# or
sudo systemctl start inventory-store
```

---

## Quick One-Liner Deployment

```bash
cd /path/to/inventory-store && git pull origin main && cd apps/web && npm install && npm run build && pm2 restart inventory-store
```

---

## Post-Deployment Checklist

- [ ] Verify application is running: `curl http://localhost:3000`
- [ ] Check PM2/systemd status
- [ ] Review application logs for errors
- [ ] Test key functionality (login, orders, etc.)
- [ ] Verify database connection
- [ ] Check environment variables are set
- [ ] Monitor resource usage (CPU, memory)

---

## Notes

- Replace `/path/to/inventory-store` with your actual project path
- Replace `inventory-store` with your PM2 process name
- Ensure Node.js version matches (check with `node -v`)
- Make sure MySQL/MariaDB is running if using database
- Keep your `.env` file secure and never commit it to git
