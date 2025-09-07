# Inventory Store - Production-Grade E-commerce Monolith

A complete inventory management and e-commerce solution built with Next.js 14, featuring catalog → cart → checkout → order → WhatsApp integration → seller dashboard, plus comprehensive inventory management with suppliers, purchase orders, receiving, stock ledger, and reorder suggestions.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (or use [Neon](https://neon.tech) for development)
- pnpm (recommended) or npm

### One-Command Bootstrap

```bash
# Clone and setup
git clone <repository-url>
cd inventory-store
cd apps/web

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your database URL and other settings

# Setup database
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

### Demo Access

- **Public Store**: http://localhost:3000/demo-boutique
- **Seller Login**: demo@boutique.test (check console for magic link)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth with email magic links
- **Payments**: Razorpay (test mode, feature-flagged)
- **UI Components**: shadcn/ui + Radix UI primitives

### Project Structure

```
/apps/web                # Next.js application
  /src/app
    /(public)            # Public store pages
      /[store]           # Store catalog
      /[store]/cart      # Shopping cart
      /[store]/checkout  # Checkout process
    /seller              # Seller dashboard (auth required)
      /login             # Seller authentication
      /products          # Product management
      /orders            # Order management
      /inventory         # Stock management + reorder suggestions
      /suppliers         # Supplier management
      /purchase-orders   # Purchase order management
      /settings          # Store settings
    /api                 # API routes
  /prisma
    schema.prisma        # Database schema
  /scripts
    seed.ts              # Demo data seeding
  /src/lib               # Utility libraries
    db.ts                # Database connection
    auth.ts              # NextAuth configuration
    whatsapp.ts          # WhatsApp deep-link helper
    money.ts             # Currency utilities
    validators.ts        # Zod validation schemas
    rzp.ts               # Razorpay integration
```

## 📊 Data Model

### Core Entities

- **User**: Store owners (sellers)
- **Store**: Individual store instances with settings
- **Product**: Inventory items with stock tracking
- **Order**: Customer orders with items
- **Supplier**: Product suppliers with lead times
- **PurchaseOrder**: Supplier purchase orders
- **StockLedger**: Complete audit trail of stock movements

### Business Rules

1. **Stock Management**: All stock changes are transactional with ledger entries
2. **Moving Average Cost**: Automatic cost price updates on PO receipts
3. **Reorder Suggestions**: Products below reorder point trigger suggestions
4. **Negative Stock Prevention**: Orders blocked if insufficient stock
5. **WhatsApp Integration**: Deep-link notifications to sellers

## 🛒 Features

### Public Store

- **Catalog**: Product grid with images, pricing, stock status
- **Cart**: Client-side cart management with localStorage
- **Checkout**: Customer information and payment method selection
- **Success Page**: Order confirmation with WhatsApp notification

### Seller Dashboard

- **Products**: CRUD operations, stock management, reorder settings
- **Orders**: Order pipeline (Pending → Confirmed → Shipped → Delivered)
- **Inventory**: Stock levels, reorder suggestions, days of cover
- **Suppliers**: Supplier management with lead times
- **Purchase Orders**: Create, send, receive, and track POs
- **Settings**: Store configuration, WhatsApp, UPI settings

### Inventory Management

- **Stock Ledger**: Complete audit trail of all stock movements
- **Reorder Suggestions**: Automated suggestions based on stock levels
- **Purchase Orders**: Full PO lifecycle management
- **Receiving**: Partial receiving with automatic cost updates
- **Supplier Management**: Lead time tracking and product mapping

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Email (for magic links)
RESEND_API_KEY=your-resend-api-key

# Payments (optional)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_ENABLED=false  # Set to true to enable Razorpay
```

### Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed with demo data
pnpm db:seed
```

## 🧪 Testing

### Unit Tests

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Test Coverage

- Moving average cost calculations
- Stock validation and negative stock prevention
- Purchase order status transitions
- Stock ledger integrity

## 🚀 Deployment

### VPS Deployment (Ubuntu LTS)

#### 1. Server Setup

```bash
# Create non-root user
adduser inventory
usermod -aG sudo inventory
su - inventory

# Setup SSH keys
mkdir -p ~/.ssh
# Add your public key to ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get update
sudo apt-get install -y mysql-server mysql-client

# Install Nginx
sudo apt-get install -y nginx

# Install PM2
sudo npm install -g pm2
```

#### 2. Security Setup

```bash
# Configure UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Install fail2ban
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### 3. Application Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd inventory-store/apps/web

# Install dependencies
npm install

# Build application
npm run build

# Setup PM2 ecosystem
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'inventory-store',
    script: 'npm',
    args: 'start',
    cwd: '/home/inventory/inventory-store/apps/web',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Nginx Configuration

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/inventory-store

# Add configuration
server {
    listen 80;
    server_name your-domain.com;

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

# Enable site
sudo ln -s /etc/nginx/sites-available/inventory-store /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. SSL Setup

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Database Backup

```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
# Upload to cloud storage or external backup service
EOF

chmod +x backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/inventory/backup.sh
```

## 📱 WhatsApp Integration

The system generates WhatsApp deep-links for order notifications:

```
https://wa.me/919876543210?text=🛍️%20Demo%20Boutique%20-%20Order%20%23ORDER_ID
```

Features:
- Pre-filled order details
- Customer information
- Itemized order list
- Total amount and delivery address
- Store-specific WhatsApp number targeting

## 💰 Payment Integration

### Razorpay (Test Mode)

- Feature-flagged with `RAZORPAY_ENABLED` environment variable
- Test mode only for development
- Order creation and signature verification
- Automatic order status updates

### Cash on Delivery (Default)

- Primary payment method
- Order confirmation by seller
- No payment processing required

## 🔄 End-to-End Demo

### 1. Customer Journey

1. Visit http://localhost:3000/demo-boutique
2. Browse products and add to cart
3. Proceed to checkout
4. Fill delivery information
5. Place order (COD)
6. View success page with WhatsApp button

### 2. Seller Journey

1. Check console for magic link (demo@boutique.test)
2. Login to seller dashboard
3. View pending orders
4. Confirm order status
5. Update to shipped/delivered

### 3. Inventory Management

1. Create purchase order with supplier
2. Send PO to supplier
3. Receive partial shipment
4. Check stock updates and cost price changes
5. View reorder suggestions

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:seed          # Seed with demo data

# Testing
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode

# Linting
pnpm lint             # Run ESLint
```

### Code Structure

- **API Routes**: RESTful endpoints in `/src/app/api`
- **Components**: Reusable UI components
- **Lib**: Utility functions and configurations
- **Types**: TypeScript type definitions
- **Validators**: Zod schemas for data validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ for modern e-commerce and inventory management**

