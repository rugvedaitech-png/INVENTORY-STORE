CREATE DATABASE  IF NOT EXISTS `inventory_store` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `inventory_store`;
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,2,'Rice & Grains','Basmati rice, regular rice, wheat, and other grains','rice-grains',NULL,1,1,'2025-09-09 08:02:15.435','2025-09-09 08:02:15.435'),(2,2,'Pulses & Lentils','Dal, chana, rajma, and other protein-rich pulses','pulses-lentils',NULL,1,2,'2025-09-09 08:02:15.440','2025-09-09 08:02:15.440'),(3,2,'Cooking Oil','Sunflower oil, mustard oil, coconut oil, and ghee','cooking-oil',NULL,1,3,'2025-09-09 08:02:15.445','2025-09-09 08:02:15.445'),(4,2,'Sugar & Sweeteners','White sugar, brown sugar, jaggery, and honey','sugar-sweeteners',NULL,1,4,'2025-09-09 08:02:15.450','2025-09-09 08:02:15.450'),(5,2,'Salt & Spices','Table salt, rock salt, turmeric, red chili, and masala','salt-spices',NULL,1,5,'2025-09-09 08:02:15.456','2025-09-09 08:02:15.456'),(6,2,'Flour & Atta','Wheat flour, rice flour, besan, and other flours','flour-atta',NULL,1,6,'2025-09-09 08:02:15.460','2025-09-09 08:02:15.460'),(7,2,'Tea & Coffee','Tea leaves, coffee powder, and related beverages','tea-coffee',NULL,1,7,'2025-09-09 08:02:15.467','2025-09-09 08:02:15.467'),(8,2,'Dry Fruits & Nuts','Almonds, cashews, raisins, and other dry fruits','dry-fruits-nuts',NULL,1,8,'2025-09-09 08:02:15.472','2025-09-09 08:02:15.472'),(9,2,'Cereals & Breakfast','Cornflakes, oats, poha, and breakfast items','cereals-breakfast',NULL,1,9,'2025-09-09 08:02:15.477','2025-09-09 08:02:15.477'),(10,2,'Canned & Packaged','Canned vegetables, pickles, and packaged foods','canned-packaged',NULL,1,10,'2025-09-09 08:02:15.481','2025-09-09 08:02:15.481'),(21,2,'bakery','bakery and hot foods ','bakery',NULL,1,10,'2025-09-09 08:19:28.347','2025-09-09 08:19:28.347'),(22,2,'CI','CI','ci','/uploads/categories/1757406463469-rmi4i877d.jpg',1,255,'2025-09-09 08:26:55.557','2025-09-09 08:27:47.663');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,'customer@demo.com','Demo Customer','919876543212','123 Demo Street, Demo City',3,1,'2025-09-07 17:43:23.026','2025-09-07 17:43:23.026'),(2,'modunikhil@gmail.com','Modu Nikhileswar','07396807340','',5,1,'2025-09-09 07:41:12.259','2025-09-09 07:41:12.259'),(3,'modunikhileswar@gmail.com','Nikhil','07396807340','',6,2,'2025-09-09 10:29:04.434','2025-09-09 10:29:04.434'),(4,'7396807340@customer.local','chandra sekhar M','7396807340','RUGVED AI TECH, 44-41-3/A, Nandagiri Nagar, Akkayapalem, Visakhapatnam',NULL,2,'2025-09-09 15:20:08.805','2025-09-09 15:21:17.020'),(5,'customer@store.in','Nikhil','7396807340','',7,2,'2025-09-12 07:14:14.936','2025-09-12 07:14:14.936');
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
  `status` enum('PENDING','AWAITING_CONFIRMATION','CONFIRMED','SHIPPED','DELIVERED','CANCELLED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paymentMethod` enum('COD','UPI','CARD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `paymentRef` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `totalAmount` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `subtotal` int NOT NULL DEFAULT '0' COMMENT 'Amount before discount in paise',
  `discountAmount` int NOT NULL DEFAULT '0' COMMENT 'Discount amount in paise',
  `discountType` enum('AMOUNT','PERCENTAGE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AMOUNT' COMMENT 'Type of discount applied',
  `addressId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Order_storeId_fkey` (`storeId`),
  KEY `Order_customerId_fkey` (`customerId`),
  KEY `idx_order_discount` (`discountAmount`,`discountType`),
  KEY `idx_order_subtotal` (`subtotal`),
  KEY `Order_addressId_fkey` (`addressId`),
  CONSTRAINT `Order_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `useraddress` (`id`),
  CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
INSERT INTO `order` VALUES (1,2,6,'Modu Nikhileswar','7396807340','RUGVED AI TECH, 44-41-3/A, Nandagiri Nagar, Akkayapalem, Visakhapatnam','CONFIRMED','COD',NULL,8500,'2025-09-09 15:04:40.062','2025-09-09 15:15:43.067',10000,15,'PERCENTAGE',NULL),(2,2,6,'Modu Nikhileswar','7396807340','RUGVED AI TECH, 44-41-3/A, Nandagiri Nagar, Akkayapalem, Visakhapatnam','PENDING','UPI',NULL,32000,'2025-09-09 15:20:08.807','2025-09-09 15:20:08.807',0,0,'AMOUNT',NULL),(3,2,6,'chandra sekhar M','7396807340','RUGVED AI TECH, 44-41-3/A, Nandagiri Nagar, Akkayapalem, Visakhapatnam','CONFIRMED','COD',NULL,9000,'2025-09-09 15:21:17.025','2025-09-09 15:21:58.912',0,0,'AMOUNT',NULL),(4,2,6,'Modu Nikhileswar','7396807340','radha enclave, akkayyapalem','CONFIRMED','COD',NULL,16000,'2025-09-09 15:49:06.365','2025-09-12 07:46:31.465',0,0,'AMOUNT',NULL),(5,2,6,'Modu Nikhileswar','7396807340','radha enclave, akkayyapalem','CONFIRMED','COD',NULL,24000,'2025-09-09 15:54:54.589','2025-09-12 07:46:27.808',0,0,'AMOUNT',NULL),(6,2,6,'nikhileswar viewer M','7396807340','RUGVED AI TECH, 44-41-3/A, Nandagiri Nagar, Akkayapalem, Visakhapatnam','CONFIRMED','COD',NULL,56000,'2025-09-09 16:14:47.243','2025-09-12 07:46:22.991',0,0,'AMOUNT',NULL),(7,2,6,'chandra sekhar M','7396807340','RUGVED AI TECH, 44-41-3/A, Nandagiri Nagar, Akkayapalem, Visakhapatnam','CONFIRMED','COD',NULL,9000,'2025-09-12 13:20:44.693','2025-09-13 10:45:13.653',0,0,'AMOUNT',NULL),(8,1,NULL,'Test Customer','9876543210','Test Address','PENDING','COD',NULL,9000,'2025-09-15 13:42:23.000','2025-09-15 13:42:23.000',10000,1000,'AMOUNT',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitem`
--

LOCK TABLES `orderitem` WRITE;
/*!40000 ALTER TABLE `orderitem` DISABLE KEYS */;
INSERT INTO `orderitem` VALUES (1,1,42,4,4500),(2,2,43,4,8000),(3,3,46,6,1500),(4,4,43,2,8000),(5,5,44,2,12000),(6,6,43,7,8000),(7,7,42,2,4500);
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
  KEY `Product_supplierId_fkey` (`supplierId`),
  KEY `Product_categoryId_fkey` (`categoryId`),
  KEY `Product_storeId_fkey` (`storeId`),
  CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Product_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Product_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,1,'Basmati Rice (1kg)','Premium quality basmati rice, perfect for daily meals','RICE-BAS-001',12000,10000,50,10,25,1,'[\"https://picsum.photos/400/400?random=1\"]',1,'2025-09-07 17:43:23.040','2025-09-07 17:43:23.040',NULL),(2,1,'Whole Wheat Flour (1kg)','Freshly ground whole wheat flour for healthy rotis','FLOUR-WW-001',4500,3500,30,5,15,1,'[\"https://picsum.photos/400/400?random=2\"]',1,'2025-09-07 17:43:23.048','2025-09-07 17:43:23.048',NULL),(3,1,'Red Lentils (500g)','High protein red lentils, great for dal','LENTIL-RED-001',8000,6500,25,8,20,1,'[\"https://picsum.photos/400/400?random=3\"]',1,'2025-09-07 17:43:23.053','2025-09-07 17:43:23.053',NULL),(4,1,'Chickpeas (500g)','Nutritious chickpeas for salads and curries','CHICKPEA-001',7500,6000,20,5,15,1,'[\"https://picsum.photos/400/400?random=4\"]',1,'2025-09-07 17:43:23.059','2025-09-07 17:43:23.059',NULL),(5,1,'Cooking Oil (1L)','Refined sunflower oil for cooking','OIL-SUN-001',15000,12000,15,5,10,1,'[\"https://picsum.photos/400/400?random=5\"]',1,'2025-09-07 17:43:23.064','2025-09-07 17:43:23.064',NULL),(6,1,'Sugar (1kg)','Pure white sugar for daily use','SUGAR-WHITE-001',5500,4500,40,10,20,1,'[\"https://picsum.photos/400/400?random=6\"]',1,'2025-09-07 17:43:23.069','2025-09-07 17:43:23.069',NULL),(7,1,'Salt (1kg)','Iodized table salt','SALT-IOD-001',2500,2000,60,15,30,1,'[\"https://picsum.photos/400/400?random=7\"]',1,'2025-09-07 17:43:23.075','2025-09-07 17:43:23.075',NULL),(8,1,'Turmeric Powder (100g)','Pure turmeric powder for cooking','SPICE-TUR-001',3500,2800,25,5,15,1,'[\"https://picsum.photos/400/400?random=8\"]',1,'2025-09-07 17:43:23.082','2025-09-07 17:43:23.082',NULL),(9,1,'Cumin Seeds (100g)','Aromatic cumin seeds for tempering','SPICE-CUM-001',4500,3500,20,5,10,1,'[\"https://picsum.photos/400/400?random=9\"]',1,'2025-09-07 17:43:23.090','2025-09-07 17:43:23.090',NULL),(10,1,'Black Pepper (50g)','Whole black peppercorns','SPICE-PEP-001',5500,4500,15,3,8,1,'[\"https://picsum.photos/400/400?random=10\"]',1,'2025-09-07 17:43:23.098','2025-09-07 17:43:23.098',NULL),(11,1,'Basmati Rice (1kg)','Premium quality basmati rice, perfect for daily consumption','RICE-001',12000,10000,50,10,100,2,'[\"https://picsum.photos/400/400?random=1\"]',1,'2025-09-08 07:40:52.643','2025-09-08 07:40:52.643',NULL),(12,1,'Whole Wheat Flour (1kg)','Freshly ground whole wheat flour for rotis and breads','WHEAT-001',4500,3500,30,8,50,2,'[\"https://picsum.photos/400/400?random=2\"]',1,'2025-09-08 07:40:52.652','2025-09-08 07:40:52.652',NULL),(13,1,'Toor Dal (500g)','High protein toor dal, essential for daily nutrition','DAL-001',8000,6500,25,5,40,2,'[\"https://picsum.photos/400/400?random=3\"]',1,'2025-09-08 07:40:52.664','2025-09-08 07:40:52.664',NULL),(14,1,'Cooking Oil (1L)','Refined sunflower oil for healthy cooking','OIL-001',12000,9500,20,5,30,2,'[\"https://picsum.photos/400/400?random=4\"]',1,'2025-09-08 07:40:52.672','2025-09-08 07:40:52.672',NULL),(15,1,'Sugar (1kg)','Pure white sugar for daily use','SUGAR-001',4500,3500,40,8,50,2,'[\"https://picsum.photos/400/400?random=5\"]',1,'2025-09-08 07:40:52.678','2025-09-08 07:40:52.678',NULL),(16,1,'Salt (500g)','Iodized table salt for daily cooking needs','SALT-001',1500,1000,60,10,100,2,'[\"https://picsum.photos/400/400?random=6\"]',1,'2025-09-08 07:40:52.684','2025-09-08 07:40:52.684',NULL),(17,1,'Red Lentils (500g)','Masoor dal - rich in protein and easy to cook','LENTIL-001',7000,5500,35,8,50,2,'[\"https://picsum.photos/400/400?random=7\"]',1,'2025-09-08 07:40:52.690','2025-09-08 07:40:52.690',NULL),(18,1,'Chickpeas (500g)','Kabuli chana - versatile and nutritious legume','CHANA-001',6000,4500,28,6,40,2,'[\"https://picsum.photos/400/400?random=8\"]',1,'2025-09-08 07:40:52.695','2025-09-08 07:40:52.695',NULL),(19,1,'Black Gram (500g)','Urad dal - essential for South Indian cuisine','URAD-001',7500,6000,22,5,35,2,'[\"https://picsum.photos/400/400?random=9\"]',1,'2025-09-08 07:40:52.702','2025-09-08 07:40:52.702',NULL),(20,1,'Green Gram (500g)','Moong dal - light and easy to digest','MOONG-001',6500,5000,30,6,45,2,'[\"https://picsum.photos/400/400?random=10\"]',1,'2025-09-08 07:40:52.709','2025-09-08 07:40:52.709',NULL),(41,2,'Basmati Rice (1kg)','Premium quality basmati rice, perfect for daily consumption','RICE-001',12000,10000,112,10,100,NULL,'[\"https://picsum.photos/400/400?random=1\"]',1,'2025-09-09 13:44:24.000','2025-09-15 07:15:24.924',1),(42,2,'Whole Wheat Flour (1kg)','Freshly ground whole wheat flour for rotis and breads','WHEAT-001',4500,3500,24,8,50,NULL,'[\"https://picsum.photos/400/400?random=2\"]',1,'2025-09-09 13:44:24.000','2025-09-13 10:45:13.659',6),(43,2,'Toor Dal (500g)','High protein toor dal, essential for daily nutrition','DAL-001',8000,6500,12,5,40,NULL,'[\"https://picsum.photos/400/400?random=3\"]',0,'2025-09-09 13:44:24.000','2025-09-13 10:44:07.390',2),(44,2,'Cooking Oil (1L)','Refined sunflower oil for healthy cooking','OIL-001',12000,9500,88,5,30,NULL,'[\"https://picsum.photos/400/400?random=4\"]',1,'2025-09-09 13:44:24.000','2025-09-15 07:15:24.937',3),(45,2,'Sugar (1kg)','Pure white sugar for daily use','SUGAR-001',4500,3500,40,8,50,NULL,'[\"https://picsum.photos/400/400?random=5\"]',1,'2025-09-09 13:44:24.000','2025-09-09 13:44:24.000',4),(46,2,'Salt (500g)','Iodized table salt for daily cooking needs','SALT-001',1500,1000,106,10,100,NULL,'[\"https://picsum.photos/400/400?random=6\"]',1,'2025-09-09 13:44:24.000','2025-09-15 07:15:17.479',5);
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
  `status` enum('DRAFT','QUOTATION_REQUESTED','QUOTATION_SUBMITTED','QUOTATION_APPROVED','QUOTATION_REJECTED','SENT','SHIPPED','PARTIAL','RECEIVED','REJECTED','CLOSED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` int NOT NULL DEFAULT '0',
  `taxTotal` int NOT NULL DEFAULT '0',
  `total` int NOT NULL DEFAULT '0',
  `placedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `quotationRequestedAt` datetime(3) DEFAULT NULL,
  `quotationSubmittedAt` datetime(3) DEFAULT NULL,
  `quotationApprovedAt` datetime(3) DEFAULT NULL,
  `quotationRejectedAt` datetime(3) DEFAULT NULL,
  `quotationNotes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PurchaseOrder_code_key` (`code`),
  KEY `PurchaseOrder_storeId_fkey` (`storeId`),
  KEY `PurchaseOrder_supplierId_fkey` (`supplierId`),
  CONSTRAINT `PurchaseOrder_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PurchaseOrder_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseorder`
--

LOCK TABLES `purchaseorder` WRITE;
/*!40000 ALTER TABLE `purchaseorder` DISABLE KEYS */;
INSERT INTO `purchaseorder` VALUES (1,1,1,'PO-2025-0001','SENT','Regular restock order',272500,0,272500,'2025-09-07 17:43:23.106','2025-09-07 17:43:23.108','2025-09-07 17:43:23.108',NULL,NULL,NULL,NULL,NULL),(4,2,3,'PO-2025-0001-103012','DRAFT','PO',75000000,0,75000000,NULL,'2025-09-12 08:35:03.019','2025-09-12 08:35:03.019',NULL,NULL,NULL,NULL,NULL),(5,2,4,'PO-2025-0002-349154','DRAFT','pvt-12',450000,0,450000,NULL,'2025-09-12 08:39:09.159','2025-09-12 08:39:09.159',NULL,NULL,NULL,NULL,NULL),(6,2,3,'PO-2025-0003-818024','RECEIVED','POPO',6740000,0,6740000,'2025-09-12 10:52:55.793','2025-09-12 10:26:58.029','2025-09-15 07:15:24.903',NULL,NULL,NULL,NULL,NULL),(7,2,3,'PO-2025-0004-219833','QUOTATION_APPROVED','po',1000,180,1180,NULL,'2025-09-12 11:40:19.841','2025-09-15 07:15:21.381','2025-09-12 11:40:26.000','2025-09-13 11:13:17.741','2025-09-15 07:15:21.380',NULL,NULL),(8,2,3,'PO-2025-0005-369032','RECEIVED','POO',500000,90000,590000,NULL,'2025-09-12 11:42:49.037','2025-09-15 07:15:17.454','2025-09-12 11:42:53.000','2025-09-12 11:51:08.000','2025-09-12 11:51:40.000',NULL,NULL),(9,2,3,'PO-2025-0006-926045','RECEIVED','',1000,180,1180,NULL,'2025-09-12 11:52:06.050','2025-09-12 12:29:51.702','2025-09-12 11:52:09.000','2025-09-12 11:52:21.000','2025-09-12 11:52:52.000',NULL,NULL),(10,2,3,'PO-2025-0007-608536','RECEIVED','',6000,1080,7080,NULL,'2025-09-12 12:20:08.541','2025-09-12 12:22:17.490','2025-09-12 12:20:25.000','2025-09-12 12:20:51.000','2025-09-12 12:21:35.000',NULL,NULL),(11,2,4,'PO-2025-0008-507124','QUOTATION_REQUESTED','POOO',0,0,0,NULL,'2025-09-13 10:48:27.134','2025-09-15 07:15:10.913','2025-09-15 07:15:10.911',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `purchaseorder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchaseorderauditlog`
--

DROP TABLE IF EXISTS `purchaseorderauditlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseorderauditlog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchaseOrderId` int NOT NULL,
  `userId` int NOT NULL,
  `action` varchar(191) NOT NULL,
  `previousStatus` enum('DRAFT','QUOTATION_REQUESTED','QUOTATION_SUBMITTED','QUOTATION_APPROVED','QUOTATION_REJECTED','SENT','SHIPPED','PARTIAL','RECEIVED','REJECTED','CLOSED','CANCELLED') NOT NULL,
  `newStatus` enum('DRAFT','QUOTATION_REQUESTED','QUOTATION_SUBMITTED','QUOTATION_APPROVED','QUOTATION_REJECTED','SENT','SHIPPED','PARTIAL','RECEIVED','REJECTED','CLOSED','CANCELLED') NOT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `PurchaseOrderAuditLog_purchaseOrderId_fkey` (`purchaseOrderId`),
  KEY `PurchaseOrderAuditLog_userId_fkey` (`userId`),
  CONSTRAINT `PurchaseOrderAuditLog_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchaseorder` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PurchaseOrderAuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseorderauditlog`
--

LOCK TABLES `purchaseorderauditlog` WRITE;
/*!40000 ALTER TABLE `purchaseorderauditlog` DISABLE KEYS */;
INSERT INTO `purchaseorderauditlog` VALUES (1,1,1,'shipped','SENT','SHIPPED','Order shipped by supplier','2025-09-12 16:05:37.000'),(2,6,4,'sent','DRAFT','SENT','Order sent to supplier','2025-09-12 10:52:56.000'),(3,6,8,'shipped','SENT','SHIPPED','Order marked as shipped by supplier','2025-09-12 10:53:09.000'),(4,8,8,'quotation_submitted','QUOTATION_REQUESTED','QUOTATION_SUBMITTED','Quotation submitted by supplier','2025-09-12 11:51:08.000'),(5,8,4,'quotation_approved','QUOTATION_SUBMITTED','QUOTATION_APPROVED','Quotation approved by store owner','2025-09-12 11:51:40.000'),(6,9,4,'quotation_requested','DRAFT','QUOTATION_REQUESTED','Quotation requested from supplier','2025-09-12 11:52:09.000'),(7,9,8,'quotation_submitted','QUOTATION_REQUESTED','QUOTATION_SUBMITTED','Quotation submitted by supplier','2025-09-12 11:52:21.000'),(8,9,4,'quotation_approved','QUOTATION_SUBMITTED','QUOTATION_APPROVED','Quotation approved by store owner','2025-09-12 11:52:52.000'),(9,9,8,'shipped','QUOTATION_APPROVED','SHIPPED','Order marked as shipped by supplier','2025-09-12 12:20:15.000'),(10,10,4,'quotation_requested','DRAFT','QUOTATION_REQUESTED','Quotation requested from supplier','2025-09-12 12:20:25.000'),(11,10,8,'quotation_submitted','QUOTATION_REQUESTED','QUOTATION_SUBMITTED','Quotation submitted by supplier','2025-09-12 12:20:51.000'),(12,10,4,'quotation_approved','QUOTATION_SUBMITTED','QUOTATION_APPROVED','Quotation approved by store owner','2025-09-12 12:21:35.000'),(13,10,8,'shipped','QUOTATION_APPROVED','SHIPPED','Order marked as shipped by supplier','2025-09-12 12:22:01.000'),(14,10,4,'received','SHIPPED','RECEIVED','Order received by store owner','2025-09-12 12:22:17.000'),(15,8,8,'shipped','QUOTATION_APPROVED','SHIPPED','Order marked as shipped by supplier','2025-09-12 12:26:42.000'),(16,9,4,'received','SHIPPED','RECEIVED','Order received by store owner','2025-09-12 12:29:52.000'),(17,7,8,'quotation_submitted','QUOTATION_REQUESTED','QUOTATION_SUBMITTED','Quotation submitted by supplier','2025-09-13 11:13:17.751'),(18,11,4,'quotation_requested','DRAFT','QUOTATION_REQUESTED','Quotation requested from supplier','2025-09-15 07:15:10.944'),(19,8,4,'received','SHIPPED','RECEIVED','Order received by store owner','2025-09-15 07:15:17.460'),(20,7,4,'quotation_approved','QUOTATION_SUBMITTED','QUOTATION_APPROVED','Quotation approved by store owner','2025-09-15 07:15:21.391'),(21,6,4,'received','SHIPPED','RECEIVED','Order received by store owner','2025-09-15 07:15:24.911');
/*!40000 ALTER TABLE `purchaseorderauditlog` ENABLE KEYS */;
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
  `quotedCostPaise` int DEFAULT NULL COMMENT 'Supplier quoted cost in paise',
  PRIMARY KEY (`id`),
  KEY `PurchaseOrderItem_poId_fkey` (`poId`),
  KEY `PurchaseOrderItem_productId_fkey` (`productId`),
  CONSTRAINT `PurchaseOrderItem_poId_fkey` FOREIGN KEY (`poId`) REFERENCES `purchaseorder` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PurchaseOrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseorderitem`
--

LOCK TABLES `purchaseorderitem` WRITE;
/*!40000 ALTER TABLE `purchaseorderitem` DISABLE KEYS */;
INSERT INTO `purchaseorderitem` VALUES (1,1,1,20,10000,0,NULL),(2,1,2,15,3500,0,NULL),(3,4,44,50,1000000,0,NULL),(4,4,45,25,1000000,0,NULL),(5,5,42,150,3000,0,NULL),(6,6,41,60,19000,0,NULL),(7,6,44,70,80000,0,NULL),(8,7,45,1,1000,0,1000),(9,8,46,50,0,0,10000),(10,9,41,1,0,0,1000),(11,10,41,1,0,0,1000),(12,10,46,1,0,0,2000),(13,10,46,1,0,0,3000),(14,11,41,10,0,0,NULL),(15,11,45,119,0,0,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockledger`
--

LOCK TABLES `stockledger` WRITE;
/*!40000 ALTER TABLE `stockledger` DISABLE KEYS */;
INSERT INTO `stockledger` VALUES (1,1,1,'PO_RECEIPT',1,20,10000,'2025-09-07 17:43:23.118'),(2,1,2,'PO_RECEIPT',1,15,3500,'2025-09-07 17:43:23.118'),(3,2,42,'SALE',1,-4,NULL,'2025-09-09 15:15:43.087'),(4,2,43,'SALE',2,-4,NULL,'2025-09-09 15:20:08.815'),(5,2,46,'SALE',3,-6,NULL,'2025-09-09 15:21:58.918'),(6,2,43,'SALE',6,-7,NULL,'2025-09-12 07:46:23.013'),(7,2,44,'SALE',5,-2,NULL,'2025-09-12 07:46:27.813'),(8,2,43,'SALE',4,-2,NULL,'2025-09-12 07:46:31.471'),(9,2,41,'PO_RECEIPT',10,1,0,'2025-09-12 12:22:17.504'),(10,2,46,'PO_RECEIPT',10,1,0,'2025-09-12 12:22:17.517'),(11,2,46,'PO_RECEIPT',10,1,0,'2025-09-12 12:22:17.526'),(12,2,41,'PO_RECEIPT',9,1,0,'2025-09-12 12:29:51.719'),(13,2,42,'SALE',7,-2,NULL,'2025-09-13 10:45:13.662'),(14,2,46,'PO_RECEIPT',8,50,0,'2025-09-15 07:15:17.469'),(15,2,41,'PO_RECEIPT',6,60,19000,'2025-09-15 07:15:24.918'),(16,2,44,'PO_RECEIPT',6,70,80000,'2025-09-15 07:15:24.931');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store`
--

LOCK TABLES `store` WRITE;
/*!40000 ALTER TABLE `store` DISABLE KEYS */;
INSERT INTO `store` VALUES (1,1,'Demo Ration Store','demo-ration-store','919876543210','demo@upi','INR','2025-09-07 17:43:23.019','2025-09-07 17:43:23.019'),(2,4,'Rugveda Itech Store','rugveda-itech-store','917396807340','modunikhil1@ybl','INR','2025-09-09 08:02:15.414','2025-09-09 08:02:15.414');
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
  `userId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Supplier_userId_key` (`userId`),
  KEY `Supplier_storeId_fkey` (`storeId`),
  CONSTRAINT `Supplier_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Supplier_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--

LOCK TABLES `supplier` WRITE;
/*!40000 ALTER TABLE `supplier` DISABLE KEYS */;
INSERT INTO `supplier` VALUES (1,1,'Grain & Grocery Wholesale Ltd.','orders@grainwholesale.com','9876543210','123 Grain Market, Delhi, India 110001',2,'2025-09-07 17:43:23.033','2025-09-07 17:43:23.033',NULL),(2,1,'Grain & Grocery Wholesale Ltd.','orders@grainwholesale.com','9876543210','123 Grain Market, Delhi, India 110001',2,'2025-09-08 07:40:52.630','2025-09-08 07:40:52.630',NULL),(3,2,'Pvt enterprises','pvt@supplier.com','7396807340','pvt, radha enclave, akkayyapalem',3,'2025-09-12 08:08:08.141','2025-09-12 10:01:29.527',8),(4,2,'Pvt-12 enterprises','pvt1@supplier.com','7396807340','pvt-12, radha enclave, akkayyapalem',3,'2025-09-12 08:38:45.417','2025-09-13 10:47:48.564',9);
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'demo@boutique.test','Demo Store Owner','$2b$12$c2g3xTKmmdoEz48dWsQFhON91bmEUrs0EwC.n6JpyIOqI/WPbItNy','STORE_OWNER','919876543210','2025-09-07 17:43:22.995',1),(2,'supplier@demo.com','Demo Supplier','$2b$12$c2g3xTKmmdoEz48dWsQFhON91bmEUrs0EwC.n6JpyIOqI/WPbItNy','SUPPLIER','919876543211','2025-09-07 17:43:23.006',1),(3,'customer@demo.com','Demo Customer','$2b$12$c2g3xTKmmdoEz48dWsQFhON91bmEUrs0EwC.n6JpyIOqI/WPbItNy','CUSTOMER','919876543212','2025-09-07 17:43:23.013',1),(4,'rugvedaitech@gmail.com','Modu Nikhileswar','$2b$12$dryNo.WXL4szFoujO/05UOyC0dIzO6UE8noG3WenB/OI20PqmmmIS','STORE_OWNER','7396807340','2025-09-08 06:56:06.012',2),(5,'modunikhil@gmail.com','Modu Nikhileswar','$2b$12$ee30LYhE7uqMfRxZsoseSezhxfpKozEd/fNFBU2ddivY/eUYwc4Ke','CUSTOMER','07396807340','2025-09-09 07:41:12.237',2),(6,'modunikhileswar@gmail.com','Nikhil','$2b$12$cf6I1jgGA4fvgDz9wQWRROXdIrporVmZJm64Hf7Odww4gGH3z3Os2','CUSTOMER','07396807340','2025-09-09 10:29:04.419',2),(7,'customer@store.in','Nikhil','$2b$12$F8jKvngRK7km1yY.kg.pzOTO.I.oy4EgrVYphWz7YmRsBgrnJLmZu','CUSTOMER','7396807340','2025-09-12 07:14:14.912',2),(8,'suplier@store.in','Pvt enterprises','$2b$12$2jojVjXSwrr9VmfOD5vnv.63YYGDn14yZiQlvXBSfG9.DoEQrUyx.','SUPPLIER','7396807340','2025-09-12 08:35:51.179',2),(9,'pvtsupplier@xsupply.in','pvt supplier','$2b$12$93DYlNfnBXVuQFJNBDZwXuvX5vSvxvM.UoNjd1mtB8lKQnAjZq.ty','SUPPLIER','9849851235','2025-09-13 10:47:23.753',2);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `useraddress`
--

DROP TABLE IF EXISTS `useraddress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useraddress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `label` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_user_addresses` (`userId`),
  CONSTRAINT `UserAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `useraddress`
--

LOCK TABLES `useraddress` WRITE;
/*!40000 ALTER TABLE `useraddress` DISABLE KEYS */;
INSERT INTO `useraddress` VALUES (1,6,'home','Modu Nikhileswar','7396807340','RUGVED AI TECH, 44-41-3/A, Nandagiri Nagar, Akkayapalem, Visakhapatnam','visakhapatnam','English','530016',1,'2025-09-15 10:52:01.659','2025-09-15 10:52:01.659');
/*!40000 ALTER TABLE `useraddress` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-15 16:48:26
