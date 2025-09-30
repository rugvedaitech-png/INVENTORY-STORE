-- Create test supplier user
INSERT INTO User (email, name, password, role, phone, createdAt) 
VALUES ('supplier@demo.com', 'Test Supplier', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K', 'SUPPLIER', '1234567890', NOW());

-- Get the user ID
SET @user_id = LAST_INSERT_ID();

-- Create a test store
INSERT INTO Store (ownerId, name, slug, whatsapp, upiId, currency, createdAt, updatedAt)
VALUES (@user_id, 'Demo Store', 'demo-store', '919876543210', 'demo@upi', 'INR', NOW(), NOW());

-- Get the store ID
SET @store_id = LAST_INSERT_ID();

-- Create supplier record
INSERT INTO Supplier (storeId, userId, name, email, phone, address, leadTimeDays, createdAt, updatedAt)
VALUES (@store_id, @user_id, 'Test Supplier', 'supplier@demo.com', '1234567890', 'Test Address', 3, NOW(), NOW());

-- Show the created records
SELECT 'User created' as status, id, email, name, role FROM User WHERE email = 'supplier@demo.com';
SELECT 'Store created' as status, id, name, slug FROM Store WHERE slug = 'demo-store';
SELECT 'Supplier created' as status, id, name, email, userId FROM Supplier WHERE email = 'supplier@demo.com';
