# Demo Script

## Quick Start

1. **Setup Database**
   ```bash
   # Copy environment file
   cp .env.example .env.local
   
   # Edit .env.local with your database URL
   # For local development, you can use a free Neon database
   
   # Setup database
   npm run db:push
   npm run db:seed
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - **Public Store**: http://localhost:3000/demo-boutique
   - **Seller Login**: http://localhost:3000/seller/login

## Demo Flow

### 1. Customer Journey

1. Visit http://localhost:3000/demo-boutique
2. Browse the product catalog (5 demo products)
3. Add products to cart
4. Proceed to checkout
5. Fill in delivery information
6. Place order (COD)
7. View success page with WhatsApp button

### 2. Seller Journey

1. Go to http://localhost:3000/seller/login
2. Use demo email: `demo@boutique.test`
3. Click "Send Magic Link"
4. Check console for magic link (in development)
5. Login to seller dashboard
6. View products, orders, and inventory

### 3. Inventory Management Demo

1. In seller dashboard, go to "Inventory"
2. View stock levels and reorder suggestions
3. Check "Reorder Suggestions" tab
4. See products that need restocking

## Features Demonstrated

- ✅ Product catalog with images
- ✅ Shopping cart functionality
- ✅ Checkout process
- ✅ Order management
- ✅ WhatsApp deep-link integration
- ✅ Seller authentication
- ✅ Inventory management
- ✅ Reorder suggestions
- ✅ Stock tracking
- ✅ Database transactions
- ✅ API endpoints

## Database Schema

The demo includes:
- 1 User (demo@boutique.test)
- 1 Store (Demo Boutique)
- 1 Supplier (Fashion Wholesale Co.)
- 5 Products with varying stock levels
- 1 Sample Purchase Order
- Stock ledger entries

## API Endpoints

- `GET /api/products?storeId=xxx` - List products
- `POST /api/orders?store=xxx` - Create order
- `GET /api/orders?storeId=xxx` - List orders
- `PATCH /api/orders/[id]/status` - Update order status
- `GET /api/inventory/reorder-suggestions?storeId=xxx` - Get reorder suggestions
- `POST /api/purchase-orders/[id]/receive` - Receive purchase order items

## Environment Variables

Required for full functionality:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for JWT signing
- `NEXTAUTH_URL` - Application URL
- `RESEND_API_KEY` - For email magic links (optional for demo)

Optional:
- `RAZORPAY_KEY_ID` - For payment processing
- `RAZORPAY_KEY_SECRET` - For payment processing
- `RAZORPAY_ENABLED` - Enable/disable Razorpay (default: false)

