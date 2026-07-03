CREATE DATABASE IF NOT EXISTS `sistema_liquidaciones` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sistema_liquidaciones`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: sistema_liquidaciones
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ruc` varchar(20) DEFAULT NULL,
  `representante` varchar(100) DEFAULT NULL,
  `descripcion` text,
  `nomenclatura` varchar(255) DEFAULT NULL,
  `monto_obra` decimal(15,2) DEFAULT NULL,
  `fecha_inicio_obra` date DEFAULT NULL,
  `fecha_fin_obra` date DEFAULT NULL,
  `suma_asegurada` decimal(15,2) DEFAULT '0.00',
  `monto_garantia` decimal(15,2) DEFAULT '0.00',
  `monto_liberado` decimal(15,2) DEFAULT '0.00',
  `observaciones` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (1,'CONSORCIO SUPERVISION HUANUCO','2026-04-29 13:56:39','','','','',0.00,NULL,NULL,758965.00,78595.00,585785.00,'Prueba 123'),(2,'consorcia san juan','2026-04-29 14:58:27',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,0.00,NULL);
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cartas_fianzas`
--

DROP TABLE IF EXISTS `cartas_fianzas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cartas_fianzas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int DEFAULT NULL,
  `tipo` enum('Fiel Cumplimiento','Adelanto de Materiales','Adelanto Directo') NOT NULL,
  `numero` varchar(100) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `monto` decimal(15,2) NOT NULL,
  `pdf_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `cartas_fianzas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cartas_fianzas`
--

LOCK TABLES `cartas_fianzas` WRITE;
/*!40000 ALTER TABLE `cartas_fianzas` DISABLE KEYS */;
INSERT INTO `cartas_fianzas` VALUES (1,1,'Fiel Cumplimiento','15411-1867-2024-000','2024-11-04','2025-08-30',531677.70,NULL,'2026-04-29 16:51:07',NULL),(2,1,'Fiel Cumplimiento','15411-1867-2024-001','2025-08-31','2025-11-28',531677.70,NULL,'2026-04-29 16:51:54',NULL),(3,1,'Fiel Cumplimiento','15411-1867-2024-002','2025-11-29','2026-02-26',531677.70,NULL,'2026-04-29 16:52:34',NULL),(4,1,'Adelanto Directo','15412-0791-2024-000','2024-11-08','2025-02-05',531677.70,NULL,'2026-04-29 16:53:32',NULL),(5,1,'Adelanto de Materiales','15413-0498-2024-000','2024-11-21','2025-02-18',1063355.40,NULL,'2026-04-29 16:56:39',NULL),(6,1,'Adelanto de Materiales','15413-0498-2024-002','2025-02-19','2025-05-19',1063355.40,NULL,'2026-04-29 17:00:46',NULL),(7,1,'Adelanto de Materiales','15413-0498-2024-003','2025-05-20','2025-08-17',1063355.40,NULL,'2026-04-29 17:02:38',NULL),(8,1,'Adelanto de Materiales','15413-0498-2024-004','2025-08-18','2025-11-15',535106.99,NULL,'2026-04-29 17:03:19',NULL),(9,1,'Adelanto Directo','15412-0791-2024-001','2025-03-06','2025-05-06',531677.70,NULL,'2026-04-29 17:14:39',NULL),(10,1,'Adelanto Directo','15412-0791-2024-002','2025-05-07','2025-08-04',399180.25,NULL,'2026-04-29 17:15:36',NULL),(11,1,'Adelanto Directo','15412-0791-2024-003','2025-08-05','2025-11-02',259885.07,NULL,'2026-04-29 17:16:27',NULL),(12,1,'Adelanto de Materiales','15413-0498-2024-001','2024-11-21','2025-02-18',1063355.40,NULL,'2026-04-30 14:46:15',NULL);
/*!40000 ALTER TABLE `cartas_fianzas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int DEFAULT NULL,
  `numero` varchar(100) NOT NULL,
  `monto` decimal(15,2) NOT NULL,
  `tipo_fianza_relacionada` enum('Fiel Cumplimiento','Adelanto de Materiales','Adelanto Directo') DEFAULT NULL,
  `numero_fianza_relacionada` varchar(100) DEFAULT NULL,
  `fecha_salida` date NOT NULL,
  `pdf_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `observacion` text,
  `es_observada` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES (1,1,'F010-00111029',20358.99,NULL,'15411-1867-2024-000','2024-11-04','F010-00111029.pdf','2026-04-29 17:22:24','liberada test final',0),(2,1,'F010-00132064',6093.53,NULL,'15411-1867-2024-001 ','2025-08-20','F010-00132064.pdf','2026-04-29 17:26:22',NULL,0),(3,1,'F010-00139235',6093.53,NULL,' 15411-1867-2024-002 ','2025-11-19','F010-00139235.pdf','2026-04-29 17:28:12',NULL,0),(5,1,'F010-00112241',12116.28,'Adelanto de Materiales',' 15413-0498-2024-000','2024-11-21','F010-00112241.pdf','2026-04-29 19:42:03','1111111111111111111',0),(6,1,'F010-00118379',12151.68,'Adelanto de Materiales','15413-0498-2024-002 ','2025-11-11','F010-00118379.pdf','2026-04-29 19:44:00','',0),(7,1,'F010-00125113',9988.05,'Adelanto de Materiales',' 15413-0498-2024-003 ','2025-05-19','F010-00125113.pdf','2026-04-29 19:46:49','',0),(8,1,'F010-00131203',10023.45,'Adelanto de Materiales','15413-0498-2024-004 ','2025-08-11','F010-00131203.pdf','2026-04-29 19:49:55','',0),(9,1,'F010-00111237',6058.13,'Adelanto Directo','15412-0791-2024-000','2024-11-07','F010-00111237.pdf','2026-04-29 19:53:54','qwewww',0),(10,1,'F010-00123830',6093.53,'Adelanto Directo','15412-0791-2024-002 ','2025-04-30','F010-00123830.pdf','2026-04-29 19:55:16','',0),(11,1,'F010-00130287',4583.80,'Adelanto Directo','15412-0791-2024-003 ','2025-07-25','F010-00130287_1.pdf','2026-04-29 19:56:12','',0),(12,1,'F017-00013443',3890.84,'Adelanto de Materiales','15413-0498-2024-004','2025-08-13','F017-00013443.pdf','2026-04-29 20:00:06','DISMINUCION EN EL VALOR',1),(14,1,'F017-00013407',1587.18,'Adelanto Directo','15412-0791-2024-003 ','2025-08-08','F017-00013407.pdf','2026-04-29 20:02:39','DISMINUCION EN EL VALOR',1),(15,1,'F017-00012703',1509.74,'Adelanto Directo',' 15412-0791-2024-002 ','2025-06-06','F017-00012703.pdf','2026-04-29 20:03:42','DISMINUCION EN EL VALOR',1),(17,1,'F010-00112242',12116.28,'Adelanto de Materiales','15413-0498-2024-001','2024-11-22',NULL,'2026-04-30 14:49:22','',0),(18,1,'F010-00117427',6093.53,'Adelanto Directo','15412-0791-2024-001','2025-01-30',NULL,'2026-04-30 14:56:28','',0);
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `licitaciones`
--

DROP TABLE IF EXISTS `licitaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `licitaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int DEFAULT NULL,
  `codigo_proceso` varchar(100) DEFAULT NULL,
  `objeto` varchar(500) DEFAULT NULL,
  `entidad` varchar(255) DEFAULT NULL,
  `monto` decimal(15,2) DEFAULT NULL,
  `fecha_contrato` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `licitaciones_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'admin','admin','admin','2026-04-29 13:55:31'),(2,'Maylin','scrypt:32768:8:1$RrRBn1fSOB4e1TDG$f87bd098fa87735b7590ffe1660c41e6bcdc041625cb2fc150fffbe35bf228d79ccd03c59f8bd50459de6845c038c51d69475958f6db276aa8ebccdbf10a8abb','user','2026-04-30 17:09:21');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
