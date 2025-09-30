#!/bin/bash

# Inventory Store Deployment Script
# This script deploys the inventory store application to a VPS

set -e

echo "🚀 Starting Inventory Store Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.production.example .env
    print_warning "Please edit .env file with your actual configuration before continuing."
    print_warning "Run: nano .env"
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p public/uploads/categories
mkdir -p public/uploads/products
mkdir -p ssl
mkdir -p mysql-init

# Set proper permissions
print_status "Setting permissions..."
chmod 755 public/uploads
chmod 755 public/uploads/categories
chmod 755 public/uploads/products

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down || true

# Remove old images (optional)
print_warning "Removing old images..."
docker-compose down --rmi all || true

# Build and start services
print_status "Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service status..."
docker-compose ps

# Run database migrations
print_status "Running database migrations..."
docker-compose exec app npx prisma db push

# Seed database (optional)
read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    docker-compose exec app npm run db:seed
fi

# Show final status
print_status "Deployment completed!"
print_status "Application is running at: http://localhost:3000"
print_status "MySQL is running on port: 3306"
print_status ""
print_status "Useful commands:"
print_status "  View logs: docker-compose logs -f"
print_status "  Stop services: docker-compose down"
print_status "  Restart services: docker-compose restart"
print_status "  Update application: git pull && docker-compose up --build -d"
