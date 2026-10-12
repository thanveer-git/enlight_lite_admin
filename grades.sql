-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql
-- Generation Time: Oct 08, 2026 at 06:45 AM
-- Server version: 8.0.46
-- PHP Version: 8.3.32

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `testdb1`
--

-- --------------------------------------------------------

--
-- Table structure for table `grades`
--

CREATE TABLE `grades` (
  `id` int NOT NULL,
  `gr_grade_group_slug` varchar(255) NOT NULL,
  `gr_name` varchar(155) NOT NULL,
  `gr_range_from` decimal(10,2) NOT NULL DEFAULT '0.00',
  `gr_range_to` decimal(10,2) NOT NULL DEFAULT '0.00',
  `gr_sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `gr_is_pass` tinyint(1) DEFAULT NULL,
  `gr_account` int NOT NULL DEFAULT '0',
  `gr_status` enum('0','1') NOT NULL DEFAULT '1',
  `gr_deleted` enum('0','1') NOT NULL DEFAULT '0',
  `action` int NOT NULL,
  `action_by` int NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` timestamp NULL DEFAULT NULL
) ;

--
-- Dumping data for table `grades`
--

INSERT INTO `grades` (`id`, `gr_grade_group_slug`, `gr_name`, `gr_range_from`, `gr_range_to`, `gr_sort_order`, `gr_is_pass`, `gr_account`, `gr_status`, `gr_deleted`, `action`, `action_by`, `created`, `updated`) VALUES
(33, 'default', 'A+', 90.00, 100.00, 1, 1, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(34, 'default', 'A', 85.00, 89.00, 2, 1, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(35, 'default', 'B+', 80.00, 84.00, 3, 1, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(36, 'default', 'B', 75.00, 79.00, 4, 1, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(37, 'default', 'C+', 70.00, 74.00, 5, 1, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(38, 'default', 'C', 65.00, 69.00, 6, 1, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(39, 'default', 'D+', 60.00, 64.00, 7, 1, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(40, 'default', 'D', 50.00, 59.00, 8, 1, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(41, 'default', 'E', 1.00, 49.00, 9, 0, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(42, 'default', '-', 0.00, 0.00, 10, 0, 0, '1', '0', 0, 1, '2025-11-27 12:35:33', NULL),
(50, 'performance-grade', 'Excellent', 90.00, 100.00, 1, 1, 0, '1', '0', 0, 1, '2026-01-10 09:05:00', NULL),
(51, 'performance-grade', 'Very Good', 80.00, 89.00, 2, 1, 0, '1', '0', 0, 1, '2026-01-10 09:05:00', NULL),
(52, 'performance-grade', 'Good', 70.00, 79.00, 3, 1, 0, '1', '0', 0, 1, '2026-01-10 09:05:00', NULL),
(53, 'performance-grade', 'Satisfactory', 60.00, 69.00, 4, 1, 0, '1', '0', 0, 1, '2026-01-10 09:05:00', NULL),
(54, 'performance-grade', 'Needs Improvement', 50.00, 59.00, 5, 0, 0, '1', '0', 0, 1, '2026-01-10 09:05:00', NULL),
(55, 'performance-grade', 'Poor', 0.00, 49.00, 6, 0, 0, '1', '0', 0, 1, '2026-01-10 09:05:00', NULL),
(193, 'Demo-Grade', 'Good', 50.00, 100.00, 1, 1, 0, '1', '0', 0, 1, '2025-12-29 13:25:11', NULL),
(194, 'Demo-Grade', 'Bad', 0.00, 49.00, 2, 0, 0, '1', '0', 0, 1, '2025-12-29 13:25:11', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_gr_group_slug` (`gr_grade_group_slug`),
  ADD KEY `idx_gr_name` (`gr_name`),
  ADD KEY `idx_gr_account` (`gr_account`),
  ADD KEY `idx_gr_deleted` (`gr_deleted`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `grades`
--
ALTER TABLE `grades`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
