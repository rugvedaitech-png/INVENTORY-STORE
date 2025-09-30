# Registration Flow Implementation

## Overview
A comprehensive registration system that allows store owners to generate registration links for customers and suppliers, with automatic store association and role-based access control.

## Features Implemented

### 🗄️ **Database Schema Updates**
- **User Table**: Added `storeId` field to associate users with stores
- **Relationships**: Updated User-Store relationships with proper naming
- **Store Association**: Users can be associated with stores (customers/suppliers) or own stores (store owners)

### 🔧 **API Endpoints**

#### Registration Management
- **`/api/auth/register`** - Enhanced registration with store association
- **`/api/stores`** - List stores for authenticated user
- **`/api/stores/[slug]`** - Get store information by slug
- **`/api/stores/[id]/registration-links`** - Generate and manage registration links

#### Registration Link Generation
- **GET**: Retrieve existing registration links for a store
- **POST**: Generate new registration links with expiration
- **Store Validation**: Ensures only store owners can generate links

### 🎨 **User Interface Components**

#### Store Owner - Registration Links Management (`/seller/registration-links`)
- **Store Selection**: Choose which store to generate links for
- **Link Generation**: Create customer and supplier registration links
- **Link Management**: Copy links to clipboard
- **Instructions**: Clear guidance on how to use the system

#### Enhanced Registration Page (`/auth/register`)
- **URL Parameter Handling**: Automatically detects store and role from URL
- **Store Information Display**: Shows which store the user is joining
- **Role Pre-selection**: Role is pre-filled based on registration link
- **Dynamic UI**: Different interface for link-based vs. manual registration

### 🔐 **Security & Validation**
- **Store Ownership**: Only store owners can generate registration links
- **Store Association**: Automatic store assignment based on registration link
- **Role Validation**: Ensures proper role assignment
- **Input Validation**: Comprehensive validation for all registration data

### 📊 **Registration Flow**

#### For Store Owners
1. **Access Management**: Navigate to `/seller/registration-links`
2. **Select Store**: Choose which store to generate links for
3. **Generate Links**: Create customer and supplier registration links
4. **Share Links**: Copy and share links with intended users
5. **Monitor Registration**: Users automatically associated with store

#### For Customers/Suppliers
1. **Receive Link**: Get registration link from store owner
2. **Click Link**: Navigate to registration page with pre-filled store info
3. **Complete Registration**: Fill out registration form
4. **Automatic Association**: User is automatically linked to the store
5. **Login**: Access store-specific features

#### For Store Owners (Manual Registration)
1. **Manual Registration**: Register without store association initially
2. **Store Creation**: Create their store after registration
3. **Store Management**: Manage their store and generate links

### 🔄 **Data Flow**

#### Registration Link Generation
```
Store Owner → /seller/registration-links → Select Store → Generate Links → Share Links
```

#### User Registration via Link
```
User → Click Link → /auth/register?store=slug&role=ROLE → Store Info Loaded → Registration Form → User Created with storeId
```

#### Manual Registration
```
User → /auth/register → Select Role → Registration Form → User Created (storeId based on role)
```

### 📁 **File Structure**
```
apps/web/src/
├── app/
│   ├── api/
│   │   ├── auth/register/route.ts          # Enhanced registration API
│   │   └── stores/
│   │       ├── route.ts                    # List user's stores
│   │       ├── [slug]/route.ts             # Get store by slug
│   │       └── [id]/registration-links/
│   │           └── route.ts                # Registration link management
│   ├── auth/register/page.tsx              # Enhanced registration page
│   └── seller/registration-links/
│       └── page.tsx                        # Registration links management
├── lib/
│   └── auth-service.ts                     # Updated with storeId support
└── prisma/
    └── schema.prisma                       # Updated User model
```

### 🎯 **Key Benefits**

#### For Store Owners
- **Easy User Onboarding**: Generate links for customers and suppliers
- **Automatic Association**: Users are automatically linked to the store
- **Role Management**: Control who can register for what role
- **Store Isolation**: Each store has its own user base

#### For Customers/Suppliers
- **Simplified Registration**: Pre-filled store information
- **Clear Context**: Know exactly which store they're joining
- **Automatic Setup**: No need to manually select store
- **Immediate Access**: Ready to use store-specific features

#### For System Administrators
- **Centralized Management**: All users properly associated with stores
- **Audit Trail**: Clear tracking of user-store relationships
- **Scalable Architecture**: Supports multiple stores with isolated user bases

### 🧪 **Testing the Flow**

#### Test Registration Link Generation
1. Login as store owner
2. Navigate to `/seller/registration-links`
3. Select a store
4. Generate customer and supplier links
5. Copy links to test

#### Test User Registration via Link
1. Use generated registration link
2. Verify store information is displayed
3. Complete registration form
4. Verify user is created with correct storeId
5. Test login and access to store-specific features

#### Test Manual Registration
1. Navigate to `/auth/register` directly
2. Select role (store owner, customer, supplier)
3. Complete registration
4. Verify proper store association based on role

### 🔧 **Configuration**

#### Environment Variables
```env
DATABASE_URL="mysql://root:password@localhost:3306/inventory_store"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production-12345"
```

#### Database Schema
```sql
-- Updated User table
ALTER TABLE User ADD COLUMN storeId INT;
ALTER TABLE User ADD FOREIGN KEY (storeId) REFERENCES Store(id);

-- Relations
User.store -> Store (UserStore relation)
User.stores -> Store[] (StoreOwner relation)
```

### 🚀 **Usage Examples**

#### Generate Registration Links
```javascript
// GET /api/stores/1/registration-links
{
  "store": {
    "id": 1,
    "name": "Demo Ration Store",
    "slug": "demo-ration-store"
  },
  "links": {
    "customer": "http://localhost:3000/auth/register?store=demo-ration-store&role=CUSTOMER",
    "supplier": "http://localhost:3000/auth/register?store=demo-ration-store&role=SUPPLIER"
  }
}
```

#### Register User via Link
```javascript
// POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "CUSTOMER",
  "storeSlug": "demo-ration-store"
}
```

### 🔮 **Future Enhancements**
- [ ] Email-based authentication with verification codes
- [ ] Link expiration and usage tracking
- [ ] Bulk user invitation via email
- [ ] User role management within stores
- [ ] Registration analytics and reporting
- [ ] Custom registration forms per store
- [ ] Integration with external authentication providers

## Summary

The registration flow is now fully implemented with:
- ✅ **Store ID Integration**: Users are properly associated with stores
- ✅ **Registration Links**: Store owners can generate links for customers/suppliers
- ✅ **Automatic Association**: Users registering via links are automatically linked to stores
- ✅ **Role-based Access**: Proper role assignment and validation
- ✅ **User-friendly Interface**: Clear registration process with store context
- ✅ **Security**: Proper validation and store ownership checks

The system now supports the complete flow where store owners can provide registration links to customers and suppliers, ensuring proper store association and role-based access control.
