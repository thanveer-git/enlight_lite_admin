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
-- Table structure for table `rubrics`
--

CREATE TABLE `rubrics` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rb_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rb_outcome_html` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `rb_outcome_text` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `rb_status` enum('draft','published','in_use','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `rb_type` enum('scored','unscored') COLLATE utf8mb4_unicode_ci NOT NULL,
  `rb_grading_method` enum('weighted_average','grade_profile') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'weighted_average',
  `rb_profile_fallback` tinyint(1) NOT NULL DEFAULT '0',
  `rb_criteria` json NOT NULL,
  `rb_levels` json NOT NULL,
  `rb_descriptions` json NOT NULL,
  `rb_profile_rules` json NOT NULL,
  `rb_min_pass_level_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rb_suggested_gs_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FK to grade_scales.id, added later',
  `rb_criteria_count` int UNSIGNED GENERATED ALWAYS AS (json_length(`rb_criteria`)) STORED,
  `rb_levels_count` int UNSIGNED GENERATED ALWAYS AS (json_length(`rb_levels`)) STORED,
  `rb_used_count` int UNSIGNED NOT NULL DEFAULT '0',
  `rb_published_at` timestamp NULL DEFAULT NULL,
  `rb_archived_at` timestamp NULL DEFAULT NULL,
  `rb_created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `rb_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `rb_deleted_at` timestamp NULL DEFAULT NULL,
  `rb_created_by` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FK to existing users table, type matched later',
  `rb_updated_by` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FK to existing users table, type matched later'
) ;

--
-- Dumping data for table `rubrics`
--

INSERT INTO `rubrics` (`id`, `rb_name`, `rb_outcome_html`, `rb_outcome_text`, `rb_status`, `rb_type`, `rb_grading_method`, `rb_profile_fallback`, `rb_criteria`, `rb_levels`, `rb_descriptions`, `rb_profile_rules`, `rb_min_pass_level_id`, `rb_suggested_gs_id`, `rb_used_count`, `rb_published_at`, `rb_archived_at`, `rb_created_at`, `rb_updated_at`, `rb_deleted_at`, `rb_created_by`, `rb_updated_by`) VALUES
('rb_0054', 'Combo 1 - Scored Weighted Average Min Pass Off', '<p>Students demonstrate competency across thesis, evidence, and structure.</p>', 'Students demonstrate competency across thesis, evidence, and structure.', 'published', 'scored', 'weighted_average', 0, '[{\"id\": \"c-thesis\", \"name\": \"Thesis Clarity\", \"weight\": 30}, {\"id\": \"c-evidence\", \"name\": \"Evidence Use\", \"weight\": 30}, {\"id\": \"c-structure\", \"name\": \"Structure and Flow\", \"weight\": 40}]', '[{\"id\": \"l-excellent\", \"name\": \"Excellent\", \"point_max\": null, \"point_min\": null, \"point_type\": \"single\", \"point_value\": 4}, {\"id\": \"l-proficient\", \"name\": \"Proficient\", \"point_max\": 3.9, \"point_min\": 3, \"point_type\": \"range\", \"point_value\": null}, {\"id\": \"l-developing\", \"name\": \"Developing\", \"point_max\": 2.9, \"point_min\": 2, \"point_type\": \"range\", \"point_value\": null}, {\"id\": \"l-emerging\", \"name\": \"Emerging\", \"point_max\": 1.9, \"point_min\": 1, \"point_type\": \"range\", \"point_value\": null}]', '{\"c-thesis\": {\"l-excellent\": \"Thesis is original and precise.\", \"l-proficient\": \"Thesis is clear and focused.\"}, \"c-evidence\": {\"l-excellent\": \"Sources actively advance the argument.\", \"l-proficient\": \"Sources are relevant and cited.\"}}', '[]', NULL, 'gs_letter', 3, '2026-08-01 08:00:00', NULL, '2026-10-08 06:30:38', '2026-10-08 06:30:38', NULL, 'u_001', 'u_001'),
('rb_0057', 'Combo 4 - Scored Grade Profile Fallback On', '<p>Students demonstrate mastery across rigor, evidence, and clarity.</p>', 'Students demonstrate mastery across rigor, evidence, and clarity.', 'in_use', 'scored', 'grade_profile', 1, '[{\"id\": \"c-rigor\", \"name\": \"Rigor\", \"weight\": 40}, {\"id\": \"c-evidence\", \"name\": \"Evidence\", \"weight\": 30}, {\"id\": \"c-clarity\", \"name\": \"Clarity\", \"weight\": 30}]', '[{\"id\": \"l-excellent\", \"name\": \"Excellent\", \"point_max\": null, \"point_min\": null, \"point_type\": \"single\", \"point_value\": 4}, {\"id\": \"l-proficient\", \"name\": \"Proficient\", \"point_max\": 3.9, \"point_min\": 3, \"point_type\": \"range\", \"point_value\": null}, {\"id\": \"l-developing\", \"name\": \"Developing\", \"point_max\": 2.9, \"point_min\": 2, \"point_type\": \"range\", \"point_value\": null}, {\"id\": \"l-emerging\", \"name\": \"Emerging\", \"point_max\": 1.9, \"point_min\": 1, \"point_type\": \"range\", \"point_value\": null}]', '{\"c-rigor\": {\"l-excellent\": \"Argument is rigorous throughout.\"}}', '[{\"id\": \"pr-a\", \"paths\": [{\"tiers\": [{\"level_id\": \"l-excellent\", \"required_count\": 2}], \"floor_level_id\": \"l-proficient\"}], \"grade_label\": \"A\"}, {\"id\": \"pr-b\", \"paths\": [{\"tiers\": [{\"level_id\": \"l-proficient\", \"required_count\": 3}], \"floor_level_id\": null}], \"grade_label\": \"B\"}]', NULL, 'gs_letter', 5, '2026-08-01 08:15:00', NULL, '2026-10-08 06:30:38', '2026-10-08 06:30:38', NULL, 'u_001', 'u_002'),
('rb_0061', 'Peer Review - Unscored Descriptive', '<p>Students give structured peer feedback without numerical scores.</p>', 'Students give structured peer feedback without numerical scores.', 'draft', 'unscored', 'grade_profile', 0, '[{\"id\": \"c-kindness\", \"name\": \"Tone and Respect\", \"weight\": null}, {\"id\": \"c-actionable\", \"name\": \"Actionable Feedback\", \"weight\": null}]', '[{\"id\": \"l-exemplary\", \"name\": \"Exemplary\", \"point_max\": null, \"point_min\": null, \"point_type\": null, \"point_value\": null}, {\"id\": \"l-needs-work\", \"name\": \"Needs Work\", \"point_max\": null, \"point_min\": null, \"point_type\": null, \"point_value\": null}]', '{\"c-kindness\": {\"l-exemplary\": \"Feedback is respectful and encouraging.\"}}', '[{\"id\": \"pr-pass\", \"paths\": [{\"tiers\": [{\"level_id\": \"l-exemplary\", \"required_count\": 2}], \"floor_level_id\": null}], \"grade_label\": \"Pass\"}]', NULL, NULL, 0, NULL, NULL, '2026-10-08 06:30:38', '2026-10-08 06:30:38', NULL, 'u_002', 'u_002');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `rubrics`
--
ALTER TABLE `rubrics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_rb_name` (`rb_name`),
  ADD KEY `idx_rb_status_updated` (`rb_status`,`rb_updated_at`),
  ADD KEY `idx_rb_type` (`rb_type`),
  ADD KEY `idx_rb_suggested_gs` (`rb_suggested_gs_id`),
  ADD KEY `idx_rb_used_count` (`rb_used_count`),
  ADD KEY `idx_rb_updated` (`rb_updated_at`),
  ADD KEY `idx_rb_deleted` (`rb_deleted_at`),
  ADD KEY `idx_rb_created_by` (`rb_created_by`);
ALTER TABLE `rubrics` ADD FULLTEXT KEY `ftx_rb_search` (`rb_name`,`rb_outcome_text`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
