# POS Billing Module - Comprehensive Test Plan

## Test Environment Setup
1. Login as Store Owner
2. Navigate to `/seller/billing`
3. Ensure you have products with stock in your store

---

## Test Scenario 1: Customer Selection

### 1.1 Search Existing Customer by Phone
**Steps:**
1. Enter a phone number (10+ digits) of an existing customer
2. Wait for auto-search (500ms debounce)
3. Verify customer is automatically selected
4. Verify green badge shows customer name and phone

**Expected Result:**
- Customer found and selected automatically
- Green success badge displayed
- Phone search field cleared

### 1.2 Search Non-Existent Customer
**Steps:**
1. Enter a phone number that doesn't exist (10+ digits)
2. Wait for auto-search
3. Verify create customer form appears
4. Verify phone number is pre-filled

**Expected Result:**
- Create customer form appears
- Phone number field pre-filled with searched number
- Name and phone fields marked as required

### 1.3 Create New Customer
**Steps:**
1. Search for non-existent phone number
2. Fill in customer name (required)
3. Verify phone is pre-filled (required)
4. Optionally enter email
5. Click "Create & Add"
6. Verify customer is created and selected

**Expected Result:**
- Customer created successfully
- Customer automatically selected
- Green badge shows new customer
- Form fields cleared

### 1.4 Create Customer - Validation
**Test Cases:**
- **Empty name**: Should show error "Name and phone number are required"
- **Empty phone**: Should show error "Name and phone number are required"
- **Phone < 10 digits**: Should show error "Please enter a valid phone number"
- **Duplicate phone**: Should show API error message

**Expected Result:**
- Validation errors displayed
- Create button disabled when fields invalid

### 1.5 Clear Selected Customer
**Steps:**
1. Select a customer
2. Click X button on customer badge
3. Verify customer is cleared
4. Verify search field is available again

**Expected Result:**
- Customer selection cleared
- Back to search state

---

## Test Scenario 2: Product Scanning & Cart Management

### 2.1 Scan/Enter Valid Product SKU
**Steps:**
1. Enter a valid product SKU in barcode input
2. Press Enter or wait for scanner input
3. Verify product is added to cart
4. Verify success message appears
5. Verify input field clears

**Expected Result:**
- Product added to cart
- Blue success message: "✓ Added: [Product Name] ([SKU])"
- Input field auto-clears
- Cart shows new item

### 2.2 Scan Invalid Product SKU
**Steps:**
1. Enter invalid/non-existent SKU
2. Press Enter
3. Verify error message appears

**Expected Result:**
- Yellow warning: "Product not found"
- Error disappears after 3 seconds
- Input field clears

### 2.3 Update Product Quantity
**Steps:**
1. Add product to cart
2. Click + button to increase quantity
3. Click - button to decrease quantity
4. Verify quantity updates
5. Verify line total updates

**Expected Result:**
- Quantity increases/decreases
- Line total = price × quantity
- Cannot increase beyond stock limit
- Cannot decrease below 1

### 2.4 Remove Product from Cart
**Steps:**
1. Add product to cart
2. Click X button on cart item
3. Verify product removed

**Expected Result:**
- Product removed from cart
- Summary totals updated

### 2.5 Low Stock Warning
**Steps:**
1. Add product with stock < 10
2. Verify low stock warning appears

**Expected Result:**
- Orange warning: "Low stock: X remaining"

---

## Test Scenario 3: Discount Functionality

### 3.1 Fixed Amount Discount
**Steps:**
1. Add products to cart (e.g., subtotal = ₹1000)
2. Select "Fixed Amount" (₹) discount type
3. Enter discount amount (e.g., ₹100)
4. Verify discount calculated correctly
5. Verify total updated

**Expected Result:**
- Discount shown: "-₹100"
- Total = Subtotal - Discount + Tax
- Discount cannot exceed subtotal

### 3.2 Percentage Discount
**Steps:**
1. Add products to cart (e.g., subtotal = ₹1000)
2. Select "Percentage" (%) discount type
3. Enter discount percentage (e.g., 10%)
4. Verify discount calculated correctly

**Expected Result:**
- Discount = 10% of subtotal = ₹100
- Total updated correctly
- Percentage cannot exceed 100%

### 3.3 Discount Edge Cases
**Test Cases:**
- **Discount > Subtotal**: Should cap at subtotal amount
- **Negative discount**: Should be treated as 0
- **Empty discount**: Should be 0
- **100% discount**: Should make subtotal 0 (before tax)

**Expected Result:**
- All edge cases handled correctly
- No negative totals

### 3.4 Switch Discount Types
**Steps:**
1. Enter fixed amount discount
2. Switch to percentage
3. Verify discount recalculated
4. Switch back to fixed
5. Verify discount recalculated

**Expected Result:**
- Discount recalculates on type change
- Value preserved where possible

---

## Test Scenario 4: Tax Calculation

### 4.1 Default Tax Rate
**Steps:**
1. Add products to cart
2. Verify default tax rate is 18%
3. Verify tax calculated on amount after discount

**Expected Result:**
- Tax rate = 18% by default
- Tax = (Subtotal - Discount) × 18%

### 4.2 Custom Tax Rate
**Steps:**
1. Change tax rate (e.g., to 12%)
2. Verify tax recalculated
3. Verify total updated

**Expected Result:**
- Tax recalculated with new rate
- Total = (Subtotal - Discount) + Tax

### 4.3 Tax Edge Cases
**Test Cases:**
- **0% tax**: Should show ₹0 tax
- **100% tax**: Should calculate correctly
- **Negative tax**: Should be treated as 0
- **Empty tax rate**: Should default to 18%

**Expected Result:**
- All edge cases handled
- Tax always non-negative

### 4.4 Tax with Discount
**Steps:**
1. Add products (subtotal = ₹1000)
2. Apply 10% discount (₹100)
3. Apply 18% tax
4. Verify: Tax = (₹1000 - ₹100) × 18% = ₹162

**Expected Result:**
- Tax calculated on discounted amount
- Total = ₹900 + ₹162 = ₹1062

---

## Test Scenario 5: Complete Bill - Walk-In Customer

### 5.1 Bill Without Customer
**Steps:**
1. Add products to cart
2. Don't select customer
3. Optionally add discount
4. Optionally change tax rate
5. Click "Complete Bill"
6. Verify order created
7. Verify redirect to receipt

**Expected Result:**
- Order created with customerId = null
- buyerName = "Walk-In"
- phone = ""
- Order status = "CONFIRMED"
- Redirects to receipt page

### 5.2 Bill with Customer
**Steps:**
1. Select existing customer
2. Add products
3. Complete bill
4. Verify order linked to customer

**Expected Result:**
- Order created with customerId set
- buyerName = customer.name
- phone = customer.phone
- Order linked correctly

### 5.3 Bill with Discount and Tax
**Steps:**
1. Add products
2. Apply discount (fixed or percentage)
3. Set tax rate
4. Complete bill
5. Verify receipt shows correct totals

**Expected Result:**
- Receipt shows:
  - Subtotal
  - Discount (if applied)
  - Tax
  - Total
- All calculations correct

---

## Test Scenario 6: Stock Management

### 6.1 Stock Deduction
**Steps:**
1. Note product stock before bill
2. Add product to cart
3. Complete bill
4. Verify stock reduced

**Expected Result:**
- Stock reduced by quantity sold
- Stock ledger entry created

### 6.2 Insufficient Stock
**Steps:**
1. Add product with quantity > available stock
2. Try to complete bill
3. Verify error message

**Expected Result:**
- Error: "Insufficient stock for [Product]. Available: X, Requested: Y"
- Bill not created
- Stock not deducted

### 6.3 Stock Ledger Entry
**Steps:**
1. Complete a bill
2. Check stock ledger
3. Verify entry created

**Expected Result:**
- Stock ledger entry with:
  - refType = 'SALE'
  - refId = order.id
  - delta = negative quantity
  - unitCost = null

---

## Test Scenario 7: Error Handling

### 7.1 Network Errors
**Steps:**
1. Disconnect network
2. Try to search customer
3. Try to create customer
4. Try to complete bill

**Expected Result:**
- Error messages displayed
- UI doesn't break
- Can retry after reconnection

### 7.2 API Errors
**Test Cases:**
- Invalid store ID
- Invalid customer ID
- Product not found
- Stock insufficient
- Database errors

**Expected Result:**
- Appropriate error messages
- User-friendly error display
- No crashes

### 7.3 Validation Errors
**Test Cases:**
- Empty cart on complete bill
- Invalid discount values
- Invalid tax rates
- Missing required fields

**Expected Result:**
- Validation prevents submission
- Clear error messages
- UI guides user to fix issues

---

## Test Scenario 8: UI/UX

### 8.1 Responsive Design
**Steps:**
1. Test on desktop (1920x1080)
2. Test on tablet (768px)
3. Test on mobile (375px)

**Expected Result:**
- Layout adapts correctly
- All features accessible
- No horizontal scroll

### 8.2 Keyboard Navigation
**Steps:**
1. Tab through all fields
2. Use Enter to submit
3. Use Escape to cancel

**Expected Result:**
- Logical tab order
- Enter submits forms
- Escape cancels actions

### 8.3 Loading States
**Steps:**
1. Search customer (slow network)
2. Create customer
3. Complete bill

**Expected Result:**
- Loading indicators shown
- Buttons disabled during processing
- Clear feedback to user

### 8.4 Success Messages
**Steps:**
1. Add product
2. Select customer
3. Complete bill

**Expected Result:**
- Success messages appear
- Messages auto-dismiss or clear
- Visual feedback clear

---

## Test Scenario 9: Data Persistence

### 9.1 Cart Persistence
**Steps:**
1. Add products to cart
2. Refresh page
3. Verify cart restored

**Expected Result:**
- Cart items persist in localStorage
- Cart restored on page load

### 9.2 Customer Selection Reset
**Steps:**
1. Select customer
2. Complete bill
3. Verify customer cleared for next bill

**Expected Result:**
- Customer selection cleared after bill
- Ready for next transaction

---

## Test Scenario 10: Receipt Verification

### 10.1 Receipt Content
**Steps:**
1. Complete bill with:
   - Customer selected
   - Products added
   - Discount applied
   - Tax calculated
2. View receipt
3. Verify all details

**Expected Result:**
- Receipt shows:
  - Customer name/phone (or "Walk-In")
  - All products with quantities
  - Subtotal
  - Discount (if applied)
  - Tax
  - Total
  - Order number
  - Date/time

### 10.2 Receipt Print
**Steps:**
1. Complete bill
2. Receipt auto-opens
3. Click print
4. Verify print layout

**Expected Result:**
- Print dialog opens
- Receipt formatted for printing
- All details visible

---

## Edge Cases & Stress Tests

### Edge Case 1: Multiple Rapid Scans
- Scan multiple products rapidly
- Verify all added correctly
- Verify no duplicates

### Edge Case 2: Large Quantities
- Add product with quantity = 1000
- Verify calculations correct
- Verify stock check works

### Edge Case 3: Special Characters
- Customer name with special chars
- Product SKU with special chars
- Verify no errors

### Edge Case 4: Concurrent Operations
- Multiple tabs open
- Complete bills simultaneously
- Verify no conflicts

### Edge Case 5: Very Large Totals
- Add many high-value products
- Apply large discount
- Verify calculations don't overflow

---

## Performance Tests

### Performance 1: Page Load
- Initial page load < 2 seconds
- Cart restoration < 500ms

### Performance 2: Search Response
- Customer search < 1 second
- Product lookup < 500ms

### Performance 3: Bill Creation
- Bill creation < 2 seconds
- Receipt generation < 1 second

---

## Regression Tests

### Regression 1: Existing Features
- Verify barcode scanning still works
- Verify cart management unchanged
- Verify receipt generation works

### Regression 2: Database Integrity
- Verify orders created correctly
- Verify stock updated correctly
- Verify customer relationships maintained

---

## Test Checklist Summary

- [ ] Customer search by phone
- [ ] Customer creation from POS
- [ ] Customer validation
- [ ] Product scanning
- [ ] Cart management
- [ ] Fixed amount discount
- [ ] Percentage discount
- [ ] Tax calculation
- [ ] Complete bill (walk-in)
- [ ] Complete bill (with customer)
- [ ] Stock deduction
- [ ] Stock validation
- [ ] Error handling
- [ ] UI responsiveness
- [ ] Receipt generation
- [ ] Data persistence
- [ ] Edge cases
- [ ] Performance

---

## Notes
- All monetary values stored in paise (smallest currency unit)
- Tax calculated on amount after discount
- Stock checked before bill creation
- All operations in database transaction
- Customer email auto-generated if not provided

