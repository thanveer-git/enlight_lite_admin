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
-- Table structure for table `grade_group`
--

CREATE TABLE `grade_group` (
  `id` int NOT NULL,
  `gg_name` varchar(256) NOT NULL,
  `gg_slug` varchar(255) NOT NULL,
  `gg_grade_type` enum('percentage','cgpa','marks','comp_incomp','letter_grading') NOT NULL,
  `gg_meta_configs` json DEFAULT NULL,
  `gg_description` text,
  `gg_created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `gg_updated_at` datetime DEFAULT NULL,
  `gg_created_by` int NOT NULL,
  `gg_updated_by` int DEFAULT NULL,
  `gg_is_default` enum('0','1') NOT NULL DEFAULT '0',
  `gg_is_passed` enum('0','1') NOT NULL DEFAULT '0',
  `gg_status` enum('0','1') NOT NULL DEFAULT '1',
  `gg_used_count` int UNSIGNED NOT NULL DEFAULT '0',
  `gg_deleted` enum('0','1') NOT NULL DEFAULT '0'
) ;

--
-- Dumping data for table `grade_group`
--

INSERT INTO `grade_group` (`id`, `gg_name`, `gg_slug`, `gg_grade_type`, `gg_meta_configs`, `gg_description`, `gg_created_at`, `gg_updated_at`, `gg_created_by`, `gg_updated_by`, `gg_is_default`, `gg_status`, `gg_used_count`, `gg_deleted`) VALUES
(1, 'Default Grade', 'default', 'letter_grading', NULL, 'Built-in letter scale used when no custom scale is attached.', '2025-11-25 10:55:04', NULL, 1, NULL, '1', '1', 3, '0'),
(2, 'CGPA', 'cgpa', 'cgpa', '{\"max\": 10, \"min\": 0, \"step\": 0.01, \"pass_mark\": 5}', 'Fixed 0-10 CGPA scale. No bands.', '2025-12-29 13:28:08', NULL, 1, NULL, '1', '1', 2, '0'),
(3, 'Percentage', 'percentage', 'percentage', '{\"max\": 100, \"min\": 0, \"step\": 0.01, \"pass_mark\": 25}', 'Fixed 0-100 percentage scale. No bands.', '2025-11-25 10:55:58', NULL, 1, NULL, '1', '1', 4, '0'),
(4, 'Complete/Incomplete', 'complete_or_not', 'comp_incomp', '{\"complete_max\": 100, \"complete_min\": 51, \"complete_label\": \"Complete\", \"incomplete_max\": 50, \"incomplete_label\": \"Incomplete\"}', 'Fixed two-state scale driven by percentage threshold.', '2025-11-25 10:55:58', NULL, 1, NULL, '1', '1', 1, '0'),
(5, 'Marks', 'marks', 'marks', '{\"max\": null, \"min\": 0, \"step\": 0.01, \"pass_mark_ratio\": 0.5}', 'Fixed marks scale. Ceiling comes per assignment from totalMarks. No bands.', '2026-01-10 09:00:00', NULL, 1, NULL, '1', '1', 0, '0'),
(6, 'Performance Grade', 'performance-grade', 'letter_grading', NULL, 'Second letter variant from the mock (Excellent to Poor).', '2026-01-10 09:05:00', NULL, 1, NULL, '0', '1', 1, '0'),
(41, 'Demo Grade', 'Demo-Grade', 'letter_grading', NULL, 'Custom admin-created letter scale.', '2025-12-29 18:54:20', NULL, 1, NULL, '0', '1', 0, '0');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `grade_group`
--
ALTER TABLE `grade_group`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_gg_slug` (`gg_slug`),
  ADD KEY `idx_gg_name` (`gg_name`),
  ADD KEY `idx_gg_grade_type` (`gg_grade_type`),
  ADD KEY `idx_gg_status` (`gg_status`),
  ADD KEY `idx_gg_deleted` (`gg_deleted`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `grade_group`
--
ALTER TABLE `grade_group`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
