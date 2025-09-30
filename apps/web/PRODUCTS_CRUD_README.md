# Products CRUD Implementation

## Overview
A comprehensive CRUD (Create, Read, Update, Delete) system for products with proper store ID integration and authentication.

## Features Implemented

### 🔐 Authentication & Authorization
- **Store ID Integration**: Products are automatically associated with the authenticated user's store
- **Role-based Access**: Only `STORE_OWNER` users can manage products
- **Session Validation**: All API endpoints validate user authentication

### 📊 API Endpoints

#### `GET /api/products`
- **Purpose**: List products for the authenticated user's store
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search term for title, description, or SKU
  - `active`: Filter by active status (true/false)
- **Response**: Paginated list of products with metadata

#### `POST /api/products`
- **Purpose**: Create a new product
- **Body**: Product data (title, description, sku, price, costPrice, stock, images, active)
- **Validation**: Zod schema validation for all fields
- **Auto-assignment**: Store ID is automatically set from user session

#### `GET /api/products/[id]`
- **Purpose**: Get a specific product by ID
- **Authorization**: Only returns products belonging to user's store

#### `PUT /api/products/[id]`
- **Purpose**: Update an existing product
- **Body**: Partial product data
- **Authorization**: Only allows updates to products belonging to user's store

#### `DELETE /api/products/[id]`
- **Purpose**: Delete a product
- **Authorization**: Only allows deletion of products belonging to user's store

### 🎨 User Interface

#### Products Management Page (`/seller/products`)
- **Product Table**: Displays all products with key information
- **Search & Filter**: Real-time search and active/inactive filtering
- **Pagination**: Handles large product catalogs efficiently
- **Actions**: Edit, activate/deactivate, and delete products
- **Responsive Design**: Works on desktop and mobile devices

#### Product Form Modal
- **Create Mode**: Add new products with validation
- **Edit Mode**: Update existing products
- **Form Fields**:
  - Title (required)
  - Description (optional)
  - SKU (optional)
  - Price (required, in ₹)
  - Cost Price (optional, in ₹)
  - Stock (required, integer)
  - Active status (checkbox)
- **Validation**: Client-side and server-side validation
- **Error Handling**: User-friendly error messages

### 🔧 Technical Implementation

#### Database Integration
- **Store Association**: Products are linked to stores via `storeId`
- **User Context**: Store ID is derived from authenticated user's `ownerId`
- **Data Integrity**: Foreign key constraints ensure data consistency

#### Image Handling
- **JSON Storage**: Images are stored as JSON strings in MySQL
- **Parsing Utility**: `parseImages()` function converts JSON to array
- **Display**: Images are rendered using Next.js `Image` component

#### State Management
- **React Hooks**: `useState`, `useEffect`, `useCallback` for state management
- **Optimistic Updates**: UI updates immediately for better UX
- **Error States**: Proper loading and error handling

#### Security Features
- **Input Validation**: Zod schemas validate all inputs
- **SQL Injection Prevention**: Prisma ORM provides protection
- **Authentication**: NextAuth.js handles user sessions
- **Authorization**: Role-based access control

## Usage

### For Store Owners
1. **Access**: Navigate to `/seller/products` (requires STORE_OWNER role)
2. **Create**: Click "Add Product" to create new products
3. **Manage**: Use the table to view, edit, activate/deactivate, or delete products
4. **Search**: Use the search bar to find specific products
5. **Filter**: Toggle "Active only" to show/hide inactive products

### API Integration
```javascript
// Create a product
const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Product Name',
    price: 1999, // ₹19.99 in paise
    stock: 100,
    // ... other fields
  })
})

// List products with pagination
const response = await fetch('/api/products?page=1&limit=10&search=keyword')
const data = await response.json()
```

## File Structure
```
apps/web/src/
├── app/
│   ├── api/products/
│   │   ├── route.ts              # GET, POST endpoints
│   │   └── [id]/route.ts         # GET, PUT, DELETE endpoints
│   └── seller/products/
│       └── page.tsx              # Products management UI
├── lib/
│   └── utils.ts                  # parseImages utility
└── components/
    └── ProductCard.tsx           # Product display component
```

## Database Schema
```sql
-- Products table (simplified)
CREATE TABLE Product (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(255),
  price INT NOT NULL,           -- Stored in paise
  costPrice INT,                -- Stored in paise
  stock INT NOT NULL DEFAULT 0,
  images TEXT DEFAULT '[]',     -- JSON string
  active BOOLEAN DEFAULT true,
  storeId INT NOT NULL,         -- Foreign key to Store
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Security Considerations
- ✅ **Authentication Required**: All endpoints require valid session
- ✅ **Store Isolation**: Users can only access their own store's products
- ✅ **Input Validation**: All inputs are validated using Zod schemas
- ✅ **SQL Injection Protection**: Prisma ORM prevents SQL injection
- ✅ **XSS Protection**: React's built-in XSS protection
- ✅ **CSRF Protection**: NextAuth.js provides CSRF protection

## Performance Optimizations
- ✅ **Pagination**: Large product lists are paginated
- ✅ **Image Optimization**: Next.js Image component for optimized images
- ✅ **Database Indexing**: Proper indexes on frequently queried fields
- ✅ **Caching**: React state management reduces unnecessary API calls
- ✅ **Lazy Loading**: Components load only when needed

## Testing
- **API Testing**: Use the provided `test-products-api.js` script
- **Manual Testing**: Access `/seller/products` and test all CRUD operations
- **Authentication Testing**: Verify role-based access control

## Future Enhancements
- [ ] Bulk operations (bulk delete, bulk status change)
- [ ] Product categories and tags
- [ ] Image upload functionality
- [ ] Product variants (size, color, etc.)
- [ ] Inventory alerts and notifications
- [ ] Export/import functionality
- [ ] Advanced search and filtering
- [ ] Product analytics and reporting
