-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: inventory_store
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sortOrder` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_storeId_slug_key` (`storeId`,`slug`),
  KEY `Category_storeId_active_idx` (`storeId`,`active`),
  CONSTRAINT `Category_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` int DEFAULT NULL,
  `storeId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_email_key` (`email`),
  KEY `Customer_userId_fkey` (`userId`),
  KEY `Customer_storeId_fkey` (`storeId`),
  CONSTRAINT `Customer_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Customer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,'customer@demo.com','Demo Customer','919876543212','123 Demo Street, Demo City',3,1,'2025-09-07 17:43:23.026','2025-09-07 17:43:23.026'),(2,'modunikhil@gmail.com','Modu Nikhileswar','07396807340','',5,1,'2025-09-09 07:41:12.259','2025-09-09 07:41:12.259');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `customerId` int DEFAULT NULL,
  `buyerName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paymentMethod` enum('COD','UPI','CARD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `paymentRef` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `totalAmount` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Order_storeId_fkey` (`storeId`),
  KEY `Order_customerId_fkey` (`customerId`),
  CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderitem`
--

DROP TABLE IF EXISTS `orderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `productId` int NOT NULL,
  `qty` int NOT NULL,
  `priceSnap` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `OrderItem_orderId_fkey` (`orderId`),
  KEY `OrderItem_productId_fkey` (`productId`),
  CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitem`
--

LOCK TABLES `orderitem` WRITE;
/*!40000 ALTER TABLE `orderitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `orderitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` int NOT NULL,
  `costPrice` int DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `reorderPoint` int NOT NULL DEFAULT '0',
  `reorderQty` int NOT NULL DEFAULT '0',
  `supplierId` int DEFAULT NULL,
  `images` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '[]',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `categoryId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_sku_key` (`sku`),
  KEY `Product_storeId_fkey` (`storeId`),
  KEY `Product_supplierId_fkey` (`supplierId`),
  KEY `Product_categoryId_fkey` (`categoryId`),
  CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Product_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Product_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,1,'Basmati Rice (1kg)','Premium quality basmati rice, perfect for daily meals','RICE-BAS-001',12000,10000,50,10,25,1,'[\"https://picsum.photos/400/400?random=1\"]',1,'2025-09-07 17:43:23.040','2025-09-07 17:43:23.040',NULL),(2,1,'Whole Wheat Flour (1kg)','Freshly ground whole wheat flour for healthy rotis','FLOUR-WW-001',4500,3500,30,5,15,1,'[\"https://picsum.photos/400/400?random=2\"]',1,'2025-09-07 17:43:23.048','2025-09-07 17:43:23.048',NULL),(3,1,'Red Lentils (500g)','High protein red lentils, great for dal','LENTIL-RED-001',8000,6500,25,8,20,1,'[\"https://picsum.photos/400/400?random=3\"]',1,'2025-09-07 17:43:23.053','2025-09-07 17:43:23.053',NULL),(4,1,'Chickpeas (500g)','Nutritious chickpeas for salads and curries','CHICKPEA-001',7500,6000,20,5,15,1,'[\"https://picsum.photos/400/400?random=4\"]',1,'2025-09-07 17:43:23.059','2025-09-07 17:43:23.059',NULL),(5,1,'Cooking Oil (1L)','Refined sunflower oil for cooking','OIL-SUN-001',15000,12000,15,5,10,1,'[\"https://picsum.photos/400/400?random=5\"]',1,'2025-09-07 17:43:23.064','2025-09-07 17:43:23.064',NULL),(6,1,'Sugar (1kg)','Pure white sugar for daily use','SUGAR-WHITE-001',5500,4500,40,10,20,1,'[\"https://picsum.photos/400/400?random=6\"]',1,'2025-09-07 17:43:23.069','2025-09-07 17:43:23.069',NULL),(7,1,'Salt (1kg)','Iodized table salt','SALT-IOD-001',2500,2000,60,15,30,1,'[\"https://picsum.photos/400/400?random=7\"]',1,'2025-09-07 17:43:23.075','2025-09-07 17:43:23.075',NULL),(8,1,'Turmeric Powder (100g)','Pure turmeric powder for cooking','SPICE-TUR-001',3500,2800,25,5,15,1,'[\"https://picsum.photos/400/400?random=8\"]',1,'2025-09-07 17:43:23.082','2025-09-07 17:43:23.082',NULL),(9,1,'Cumin Seeds (100g)','Aromatic cumin seeds for tempering','SPICE-CUM-001',4500,3500,20,5,10,1,'[\"https://picsum.photos/400/400?random=9\"]',1,'2025-09-07 17:43:23.090','2025-09-07 17:43:23.090',NULL),(10,1,'Black Pepper (50g)','Whole black peppercorns','SPICE-PEP-001',5500,4500,15,3,8,1,'[\"https://picsum.photos/400/400?random=10\"]',1,'2025-09-07 17:43:23.098','2025-09-07 17:43:23.098',NULL),(11,1,'Basmati Rice (1kg)','Premium quality basmati rice, perfect for daily consumption','RICE-001',12000,10000,50,10,100,2,'[\"https://picsum.photos/400/400?random=1\"]',1,'2025-09-08 07:40:52.643','2025-09-08 07:40:52.643',NULL),(12,1,'Whole Wheat Flour (1kg)','Freshly ground whole wheat flour for rotis and breads','WHEAT-001',4500,3500,30,8,50,2,'[\"https://picsum.photos/400/400?random=2\"]',1,'2025-09-08 07:40:52.652','2025-09-08 07:40:52.652',NULL),(13,1,'Toor Dal (500g)','High protein toor dal, essential for daily nutrition','DAL-001',8000,6500,25,5,40,2,'[\"https://picsum.photos/400/400?random=3\"]',1,'2025-09-08 07:40:52.664','2025-09-08 07:40:52.664',NULL),(14,1,'Cooking Oil (1L)','Refined sunflower oil for healthy cooking','OIL-001',12000,9500,20,5,30,2,'[\"https://picsum.photos/400/400?random=4\"]',1,'2025-09-08 07:40:52.672','2025-09-08 07:40:52.672',NULL),(15,1,'Sugar (1kg)','Pure white sugar for daily use','SUGAR-001',4500,3500,40,8,50,2,'[\"https://picsum.photos/400/400?random=5\"]',1,'2025-09-08 07:40:52.678','2025-09-08 07:40:52.678',NULL),(16,1,'Salt (500g)','Iodized table salt for daily cooking needs','SALT-001',1500,1000,60,10,100,2,'[\"https://picsum.photos/400/400?random=6\"]',1,'2025-09-08 07:40:52.684','2025-09-08 07:40:52.684',NULL),(17,1,'Red Lentils (500g)','Masoor dal - rich in protein and easy to cook','LENTIL-001',7000,5500,35,8,50,2,'[\"https://picsum.photos/400/400?random=7\"]',1,'2025-09-08 07:40:52.690','2025-09-08 07:40:52.690',NULL),(18,1,'Chickpeas (500g)','Kabuli chana - versatile and nutritious legume','CHANA-001',6000,4500,28,6,40,2,'[\"https://picsum.photos/400/400?random=8\"]',1,'2025-09-08 07:40:52.695','2025-09-08 07:40:52.695',NULL),(19,1,'Black Gram (500g)','Urad dal - essential for South Indian cuisine','URAD-001',7500,6000,22,5,35,2,'[\"https://picsum.photos/400/400?random=9\"]',1,'2025-09-08 07:40:52.702','2025-09-08 07:40:52.702',NULL),(20,1,'Green Gram (500g)','Moong dal - light and easy to digest','MOONG-001',6500,5000,30,6,45,2,'[\"https://picsum.photos/400/400?random=10\"]',1,'2025-09-08 07:40:52.709','2025-09-08 07:40:52.709',NULL);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchaseorder`
--

DROP TABLE IF EXISTS `purchaseorder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseorder` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `supplierId` int NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','SENT','PARTIAL','RECEIVED','CLOSED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` int NOT NULL DEFAULT '0',
  `taxTotal` int NOT NULL DEFAULT '0',
  `total` int NOT NULL DEFAULT '0',
  `placedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PurchaseOrder_code_key` (`code`),
  KEY `PurchaseOrder_storeId_fkey` (`storeId`),
  KEY `PurchaseOrder_supplierId_fkey` (`supplierId`),
  CONSTRAINT `PurchaseOrder_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PurchaseOrder_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseorder`
--

LOCK TABLES `purchaseorder` WRITE;
/*!40000 ALTER TABLE `purchaseorder` DISABLE KEYS */;
INSERT INTO `purchaseorder` VALUES (1,1,1,'PO-2025-0001','SENT','Regular restock order',272500,0,272500,'2025-09-07 17:43:23.106','2025-09-07 17:43:23.108','2025-09-07 17:43:23.108');
/*!40000 ALTER TABLE `purchaseorder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchaseorderitem`
--

DROP TABLE IF EXISTS `purchaseorderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseorderitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `poId` int NOT NULL,
  `productId` int NOT NULL,
  `qty` int NOT NULL,
  `costPaise` int NOT NULL,
  `receivedQty` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `PurchaseOrderItem_poId_fkey` (`poId`),
  KEY `PurchaseOrderItem_productId_fkey` (`productId`),
  CONSTRAINT `PurchaseOrderItem_poId_fkey` FOREIGN KEY (`poId`) REFERENCES `purchaseorder` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PurchaseOrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseorderitem`
--

LOCK TABLES `purchaseorderitem` WRITE;
/*!40000 ALTER TABLE `purchaseorderitem` DISABLE KEYS */;
INSERT INTO `purchaseorderitem` VALUES (1,1,1,20,10000,0),(2,1,2,15,3500,0);
/*!40000 ALTER TABLE `purchaseorderitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stockledger`
--

DROP TABLE IF EXISTS `stockledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stockledger` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `productId` int NOT NULL,
  `refType` enum('SALE','PO_RECEIPT','ADJUSTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `refId` int NOT NULL,
  `delta` int NOT NULL,
  `unitCost` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `StockLedger_storeId_fkey` (`storeId`),
  KEY `StockLedger_productId_fkey` (`productId`),
  CONSTRAINT `StockLedger_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `StockLedger_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockledger`
--

LOCK TABLES `stockledger` WRITE;
/*!40000 ALTER TABLE `stockledger` DISABLE KEYS */;
INSERT INTO `stockledger` VALUES (1,1,1,'PO_RECEIPT',1,20,10000,'2025-09-07 17:43:23.118'),(2,1,2,'PO_RECEIPT',1,15,3500,'2025-09-07 17:43:23.118');
/*!40000 ALTER TABLE `stockledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store`
--

DROP TABLE IF EXISTS `store`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ownerId` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `whatsapp` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upiId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Store_slug_key` (`slug`),
  KEY `Store_ownerId_fkey` (`ownerId`),
  CONSTRAINT `Store_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store`
--

LOCK TABLES `store` WRITE;
/*!40000 ALTER TABLE `store` DISABLE KEYS */;
INSERT INTO `store` VALUES (1,1,'Demo Ration Store','demo-ration-store','919876543210','demo@upi','INR','2025-09-07 17:43:23.019','2025-09-07 17:43:23.019');
/*!40000 ALTER TABLE `store` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier`
--

DROP TABLE IF EXISTS `supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leadTimeDays` int NOT NULL DEFAULT '3',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Supplier_storeId_fkey` (`storeId`),
  CONSTRAINT `Supplier_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--

LOCK TABLES `supplier` WRITE;
/*!40000 ALTER TABLE `supplier` DISABLE KEYS */;
INSERT INTO `supplier` VALUES (1,1,'Grain & Grocery Wholesale Ltd.','orders@grainwholesale.com','9876543210','123 Grain Market, Delhi, India 110001',2,'2025-09-07 17:43:23.033','2025-09-07 17:43:23.033'),(2,1,'Grain & Grocery Wholesale Ltd.','orders@grainwholesale.com','9876543210','123 Grain Market, Delhi, India 110001',2,'2025-09-08 07:40:52.630','2025-09-08 07:40:52.630');
/*!40000 ALTER TABLE `supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('STORE_OWNER','SUPPLIER','CUSTOMER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STORE_OWNER',
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `storeId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_storeId_fkey` (`storeId`),
  CONSTRAINT `User_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'demo@boutique.test','Demo Store Owner','$2b$12$c2g3xTKmmdoEz48dWsQFhON91bmEUrs0EwC.n6JpyIOqI/WPbItNy','STORE_OWNER','919876543210','2025-09-07 17:43:22.995',1),(2,'supplier@demo.com','Demo Supplier','$2b$12$c2g3xTKmmdoEz48dWsQFhON91bmEUrs0EwC.n6JpyIOqI/WPbItNy','SUPPLIER','919876543211','2025-09-07 17:43:23.006',1),(3,'customer@demo.com','Demo Customer','$2b$12$c2g3xTKmmdoEz48dWsQFhON91bmEUrs0EwC.n6JpyIOqI/WPbItNy','CUSTOMER','919876543212','2025-09-07 17:43:23.013',1),(4,'rugvedaitech@gmail.com','Modu Nikhileswar','$2b$12$dryNo.WXL4szFoujO/05UOyC0dIzO6UE8noG3WenB/OI20PqmmmIS','STORE_OWNER','7396807340','2025-09-08 06:56:06.012',1),(5,'modunikhil@gmail.com','Modu Nikhileswar','$2b$12$ee30LYhE7uqMfRxZsoseSezhxfpKozEd/fNFBU2ddivY/eUYwc4Ke','CUSTOMER','07396807340','2025-09-09 07:41:12.237',1);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-09 13:30:48
