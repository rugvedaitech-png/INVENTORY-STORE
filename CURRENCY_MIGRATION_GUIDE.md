# Currency Migration Guide: Paise to Rupees

## Overview
All currency values are now stored in **rupees** (with Decimal precision) instead of **paise** (smallest currency unit).

## Changes Made

### 1. Database Schema (Prisma)
**Updated Fields:**
- `Product.price`: `Int` → `Decimal(10,2)` (rupees)
- `Product.costPrice`: `Int?` → `Decimal(10,2)?` (rupees)
- `Order.subtotal`: `Int` → `Decimal(10,2)` (rupees)
- `Order.discountAmount`: `Int` → `Decimal(10,2)` (rupees)
- `Order.totalAmount`: `Int` → `Decimal(10,2)` (rupees)
- `OrderItem.priceSnap`: `Int` → `Decimal(10,2)` (rupees)
- `PurchaseOrder.subtotal`: `Int` → `Decimal(10,2)` (rupees)
- `PurchaseOrder.taxTotal`: `Int` → `Decimal(10,2)` (rupees)
- `PurchaseOrder.total`: `Int` → `Decimal(10,2)` (rupees)
- `PurchaseOrderItem.costPaise` → `cost`: `Decimal(10,2)` (rupees)
- `PurchaseOrderItem.quotedCostPaise` → `quotedCost`: `Decimal(10,2)?` (rupees)
- `StockLedger.unitCost`: `Int?` → `Decimal(10,2)?` (rupees)

### 2. Money Utility Functions (`apps/web/src/lib/money.ts`)
**Updated:**
- `formatCurrency()`: Now accepts rupees directly (no division needed)
- Removed: `paiseToRupees()`, `rupeesToPaise()`, `addPaise()`, etc.
- Added: `decimalToNumber()`, `numberToDecimal()` helpers for Prisma Decimal types

### 3. Billing Module (Fully Updated)
**Files Updated:**
- ✅ `apps/web/src/components/billing/BillingSummary.tsx` - Works with rupees
- ✅ `apps/web/src/components/billing/BillingCart.tsx` - Uses formatCurrency (rupees)
- ✅ `apps/web/src/app/api/billing/create/route.ts` - Stores in rupees, converts to Decimal strings
- ✅ `apps/web/src/app/seller/billing/page.tsx` - Already uses formatCurrency

### 4. Database Migration
**File:** `apps/web/prisma/migrations/convert_currency_to_rupees/migration.sql`

This migration:
- Converts all `Int` currency columns to `Decimal(10,2)`
- Divides existing paise values by 100 to convert to rupees
- Renames `costPaise` → `cost` and `quotedCostPaise` → `quotedCost`

## Migration Steps

### Step 1: Backup Database
```bash
# Backup your database before migration
mysqldump -u [user] -p [database] > backup_before_currency_migration.sql
```

### Step 2: Run Prisma Migration
```bash
cd apps/web
npx prisma migrate deploy
# OR for development:
npx prisma migrate dev --name convert_currency_to_rupees
```

### Step 3: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 4: Restart Application
```bash
# Restart your application server
docker-compose restart app
# OR
npm run dev
```

## Files That Still Need Updates

The following files still divide by 100 (treating values as paise). These need to be updated to work directly with rupees:

### High Priority (Customer/Order Facing)
1. `apps/web/src/app/customer/order-summary/page.tsx` - Lines 538, 552, 556, 565
2. `apps/web/src/app/customer/order-tracking/page.tsx` - Check for `/100` divisions
3. `apps/web/src/app/(public)/[store]/checkout/page.tsx` - Check price calculations
4. `apps/web/src/app/(public)/[store]/browse/page.tsx` - Product price display

### Medium Priority (Store Owner)
5. `apps/web/src/app/seller/orders/[id]/page.tsx` - Already uses formatCurrency (should be OK)
6. `apps/web/src/app/seller/products/page.tsx` - Product price inputs
7. `apps/web/src/app/seller/purchase-orders/page.tsx` - Purchase order calculations
8. `apps/web/src/app/seller/billing/receipt/[id]/page.tsx` - Receipt display

### Lower Priority (Reports/Analytics)
9. `apps/web/src/app/seller/analytics/page.tsx`
10. `apps/web/src/app/seller/reports/page.tsx`
11. `apps/web/src/app/api/analytics/route.ts`

### Other Files
- `apps/web/src/app/customer/page.tsx`
- `apps/web/src/app/customer/profile/page.tsx`
- `apps/web/src/app/customer/returns/page.tsx`
- `apps/web/src/app/seller/customers/[id]/page.tsx`
- `apps/web/src/app/seller/profile/page.tsx`
- `apps/web/src/app/supplier/quotations/page.tsx`
- `apps/web/src/app/supplier/purchase-orders/page.tsx`
- `apps/web/src/app/api/orders/[id]/discount/route.ts`

## How to Update Files

### Pattern to Find:
```typescript
// OLD (paise):
const price = product.price / 100
₹{(amount / 100).toFixed(2)}
formatCurrency(amount / 100)

// NEW (rupees):
const price = decimalToNumber(product.price) // If Decimal type
₹{amount.toFixed(2)}
formatCurrency(amount) // formatCurrency now handles rupees directly
```

### Example Update:
```typescript
// BEFORE:
<p>₹{((item.product.price * item.quantity) / 100).toFixed(2)}</p>
<span>₹{(order.totalAmount / 100).toFixed(2)}</span>

// AFTER:
<p>{formatCurrency(decimalToNumber(item.product.price) * item.quantity)}</p>
<span>{formatCurrency(decimalToNumber(order.totalAmount))}</span>
```

## Testing Checklist

After migration, test:

- [ ] Product prices display correctly (no extra zeros)
- [ ] Order totals calculate correctly
- [ ] Billing module works (discount, tax calculations)
- [ ] Receipt generation shows correct amounts
- [ ] Purchase orders calculate correctly
- [ ] Reports show correct revenue/amounts
- [ ] Customer checkout shows correct prices
- [ ] All existing orders display correctly (after data migration)

## Important Notes

1. **Existing Data**: The migration automatically converts existing paise values to rupees by dividing by 100
2. **New Data**: All new data is stored directly in rupees
3. **Decimal Precision**: Using `Decimal(10,2)` allows up to ₹99,999,999.99 with 2 decimal places
4. **Prisma Decimal**: Prisma Decimal types need to be converted to numbers using `.toNumber()` or `decimalToNumber()` helper
5. **API Responses**: Decimal values from Prisma are returned as strings, convert to numbers when needed

## Rollback Plan

If you need to rollback:

1. Restore database backup
2. Revert Prisma schema changes
3. Revert code changes
4. Regenerate Prisma client

```bash
# Restore backup
mysql -u [user] -p [database] < backup_before_currency_migration.sql

# Revert schema
git checkout HEAD~1 apps/web/prisma/schema.prisma

# Regenerate
npx prisma generate
```

## Support

If you encounter issues:
1. Check Prisma client is regenerated: `npx prisma generate`
2. Verify migration ran successfully
3. Check that Decimal values are being converted properly
4. Ensure `formatCurrency()` is used instead of manual `/100` divisions

