-- Fix SKU uniqueness by making them store-specific
-- First, let's update the existing products in store 2 with unique SKUs

UPDATE product SET sku = 'RICE-001-STORE2' WHERE storeId = 2 AND sku = 'RICE-001';
UPDATE product SET sku = 'WHEAT-001-STORE2' WHERE storeId = 2 AND sku = 'WHEAT-001';
UPDATE product SET sku = 'DAL-001-STORE2' WHERE storeId = 2 AND sku = 'DAL-001';
UPDATE product SET sku = 'OIL-001-STORE2' WHERE storeId = 2 AND sku = 'OIL-001';
UPDATE product SET sku = 'SUGAR-001-STORE2' WHERE storeId = 2 AND sku = 'SUGAR-001';
UPDATE product SET sku = 'SALT-001-STORE2' WHERE storeId = 2 AND sku = 'SALT-001';

-- Now insert the new products with unique SKUs for store 2
INSERT INTO product (storeId, title, description, sku, price, costPrice, stock, reorderPoint, reorderQty, images, active, categoryId, createdAt, updatedAt) VALUES
(2, 'Basmati Rice (1kg)', 'Premium quality basmati rice, perfect for daily consumption', 'RICE-001-RUGVEDA', 12000, 10000, 50, 10, 100, '["https://picsum.photos/400/400?random=1"]', 1, (SELECT id FROM category WHERE storeId = 2 AND name = 'Rice & Grains'), NOW(), NOW()),
(2, 'Whole Wheat Flour (1kg)', 'Freshly ground whole wheat flour for rotis and breads', 'WHEAT-001-RUGVEDA', 4500, 3500, 30, 8, 50, '["https://picsum.photos/400/400?random=2"]', 1, (SELECT id FROM category WHERE storeId = 2 AND name = 'Flour & Atta'), NOW(), NOW()),
(2, 'Toor Dal (500g)', 'High protein toor dal, essential for daily nutrition', 'DAL-001-RUGVEDA', 8000, 6500, 25, 5, 40, '["https://picsum.photos/400/400?random=3"]', 1, (SELECT id FROM category WHERE storeId = 2 AND name = 'Pulses & Lentils'), NOW(), NOW()),
(2, 'Cooking Oil (1L)', 'Refined sunflower oil for healthy cooking', 'OIL-001-RUGVEDA', 12000, 9500, 20, 5, 30, '["https://picsum.photos/400/400?random=4"]', 1, (SELECT id FROM category WHERE storeId = 2 AND name = 'Cooking Oil'), NOW(), NOW()),
(2, 'Sugar (1kg)', 'Pure white sugar for daily use', 'SUGAR-001-RUGVEDA', 4500, 3500, 40, 8, 50, '["https://picsum.photos/400/400?random=5"]', 1, (SELECT id FROM category WHERE storeId = 2 AND name = 'Sugar & Sweeteners'), NOW(), NOW()),
(2, 'Salt (500g)', 'Iodized table salt for daily cooking needs', 'SALT-001-RUGVEDA', 1500, 1000, 60, 10, 100, '["https://picsum.photos/400/400?random=6"]', 1, (SELECT id FROM category WHERE storeId = 2 AND name = 'Salt & Spices'), NOW(), NOW());
