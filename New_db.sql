CREATE DATABASE  IF NOT EXISTS `ai_pbl_new` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ai_pbl_new`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: ai_pbl
-- ------------------------------------------------------
-- Server version	8.0.42

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
-- Table structure for table `activities`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `project_steps_id` int NOT NULL,
  `activity_order` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `evaluation_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_activity` (`project_id`,`project_steps_id`,`activity_order`),
  KEY `idx_activities_project_id` (`project_id`),
  KEY `idx_activities_project_steps_id` (`project_steps_id`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activities_ibfk_2` FOREIGN KEY (`project_steps_id`) REFERENCES `project_steps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--



--
-- Table structure for table `answers`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `project_id` int NOT NULL,
  `project_steps_id` int NOT NULL,
  `activity_id` int NOT NULL,
  `text_answer` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `answered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_answers` (`student_id`,`activity_id`),
  KEY `project_steps_id` (`project_steps_id`),
  KEY `idx_answers_student_id` (`student_id`),
  KEY `idx_answers_project_id` (`project_id`),
  KEY `idx_answers_activity_id` (`activity_id`),
  CONSTRAINT `answers_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `answers_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `answers_ibfk_3` FOREIGN KEY (`project_steps_id`) REFERENCES `project_steps` (`id`) ON DELETE CASCADE,
  CONSTRAINT `answers_ibfk_4` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answers`
--



--
-- Table structure for table `project_steps`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `project_steps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `steps_order` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_objectives` text COLLATE utf8mb4_unicode_ci,
  `study_hours` int DEFAULT NULL,
  `core_question` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project_steps_project_id` (`project_id`),
  CONSTRAINT `project_steps_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_steps`
--



--
-- Table structure for table `project_subjects`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `project_subjects` (
  `project_id` int NOT NULL,
  `subject_id` int NOT NULL,
  PRIMARY KEY (`project_id`,`subject_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `project_subjects_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_subjects`
--

--
-- Table structure for table `projects`
--
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text ,
  `difficulty` enum('easy','medium','hard')  NOT NULL,
  `grade_level` varchar(20)  NULL,
  `thumbnail` int DEFAULT '0',
  `images` text ,
  `objectives` text ,
  `participant_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--


--
-- Table structure for table `reports`
--
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `project_id` int NOT NULL,
  `evaluation` text COLLATE utf8mb4_unicode_ci,
  `score1` int NOT NULL,
  `score2` int NOT NULL,
  `score3` int NOT NULL,
  `score4` int NOT NULL,
  `score5` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_report` (`student_id`,`project_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `student_answers` (
  `student_id` int NOT NULL,
  `answer_id` int NOT NULL,
  PRIMARY KEY (`student_id`,`answer_id`),
  KEY `answer_id` (`answer_id`),
  CONSTRAINT `student_answers_ibfk_1` FOREIGN KEY (`answer_id`) REFERENCES `answers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_answers_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_answers`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `student_projects` (
  `student_id` int NOT NULL,
  `project_id` int NOT NULL,
  `status` enum('not_started','in_progress','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'not_started',
  `current_step_id` int DEFAULT NULL,
  `current_activity_id` int DEFAULT NULL,
  `latest_answer_id` int DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `last_activity_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`,`project_id`),
  KEY `idx_student_projects_student_id` (`student_id`),
  KEY `idx_student_projects_project_id` (`project_id`),
  KEY `idx_student_projects_status` (`status`),
  KEY `idx_student_projects_current_step_id` (`current_step_id`),
  KEY `idx_student_projects_current_activity_id` (`current_activity_id`),
  KEY `idx_student_projects_latest_answer_id` (`latest_answer_id`),
  CONSTRAINT `student_projects_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_projects_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_projects_ibfk_3` FOREIGN KEY (`current_step_id`) REFERENCES `project_steps` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_projects_ibfk_4` FOREIGN KEY (`current_activity_id`) REFERENCES `activities` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_projects_ibfk_5` FOREIGN KEY (`latest_answer_id`) REFERENCES `answers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_projects`
--


--
-- Table structure for table `student_teachers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `student_teachers` (
  `student_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  PRIMARY KEY (`student_id`,`teacher_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `student_teachers_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_teachers_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_teachers`
--



--
-- Table structure for table `students`
--
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grade` int DEFAULT NULL,
  `class` int DEFAULT NULL,
  `school` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `teacher_projects` (
  `teacher_id` int NOT NULL,
  `project_id` int NOT NULL,
  PRIMARY KEY (`teacher_id`,`project_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `teacher_projects_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_projects_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_projects`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `draft_projects` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, Auto-increment (主键, 自增)',
  `user_id` BIGINT NOT NULL COMMENT 'Creator ID (创建者ID)',
  `name` VARCHAR(255) NOT NULL COMMENT 'Project Name (项目名称)',
  `background` TEXT COMMENT 'Project Background (项目背景)',
  `expectation` TEXT COMMENT 'Project Expectation (项目期望)',
  `scene` VARCHAR(255) COMMENT 'Scene (场景)',
  `hours` VARCHAR(32) COMMENT 'Class Hours (课时)',
  `subject` VARCHAR(255) COMMENT 'Subject (comma-separated or JSON) (学科 (逗号分隔或JSON))',
  `grade` VARCHAR(32) COMMENT 'Grade (年级)',
  `driving_question` TEXT COMMENT 'Driving Question (JSON array or TEXT) (驱动性问题 (JSON数组或TEXT))',
  `goals` TEXT COMMENT 'Learning Goals (JSON array or TEXT) (学习目标 (JSON数组或TEXT))',
  `evaluation_rubric` TEXT COMMENT 'Evaluation Rubric (JSON or TEXT) (评价标准 (JSON或TEXT))',
  `tasks` TEXT COMMENT 'Tasks (JSON or TEXT) (任务 (JSON或TEXT))',
  `query_json` JSON COMMENT 'Full information snapshot (recommended, for overall traceability/AI calls) (全部信息快照 (推荐, 便于整体回溯/AI调用))',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update Time (更新时间)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time (创建时间)',
  PRIMARY KEY (`id`),
  KEY `idx_draft_projects_user_id` (`user_id`),
  KEY `idx_draft_projects_name` (`name`),
  KEY `idx_draft_projects_created_at` (`created_at`),
  KEY `idx_draft_projects_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Draft Projects Table (项目草稿表)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `draft_projects`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `draft_project_driving_question_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, Auto-increment (主键, 自增)',
  `draft_id` BIGINT NOT NULL COMMENT 'Draft Project ID (草稿项目ID)',
  `user_id` BIGINT NOT NULL COMMENT 'User ID (用户ID)',
  `round` INT NOT NULL COMMENT 'Round (轮次)',
  `user_input` TEXT COMMENT 'User revision comments/dialog content (用户修订意见/对话内容)',
  `ai_output` TEXT COMMENT 'AI-generated driving questions (JSON) (AI生成的驱动性问题 (JSON))',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time (创建时间)',
  PRIMARY KEY (`id`),
  KEY `idx_draft_project_driving_question_history_draft_id` (`draft_id`),
  KEY `idx_draft_project_driving_question_history_user_id` (`user_id`),
  KEY `idx_draft_project_driving_question_history_round` (`round`),
  KEY `idx_draft_project_driving_question_history_created_at` (`created_at`),
  CONSTRAINT `draft_project_driving_question_history_ibfk_1` FOREIGN KEY (`draft_id`) REFERENCES `draft_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Draft Project Driving Question History Table (草稿项目驱动性问题历史表)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `draft_project_driving_question_history`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `draft_project_goal_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, Auto-increment (主键, 自增)',
  `draft_id` BIGINT NOT NULL COMMENT 'Draft Project ID (草稿项目ID)',
  `user_id` BIGINT NOT NULL COMMENT 'User ID (用户ID)',
  `round` INT NOT NULL COMMENT 'Round (轮次)',
  `user_input` TEXT COMMENT 'User revision comments/dialog content (用户修订意见/对话内容)',
  `ai_output` TEXT COMMENT 'AI-generated learning goals (JSON) (AI生成的学习目标 (JSON))',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time (创建时间)',
  PRIMARY KEY (`id`),
  KEY `idx_draft_project_goal_history_draft_id` (`draft_id`),
  KEY `idx_draft_project_goal_history_user_id` (`user_id`),
  KEY `idx_draft_project_goal_history_round` (`round`),
  KEY `idx_draft_project_goal_history_created_at` (`created_at`),
  CONSTRAINT `draft_project_goal_history_ibfk_1` FOREIGN KEY (`draft_id`) REFERENCES `draft_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Draft Project Goal History Table (草稿项目学习目标历史表)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `draft_project_goal_history`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `draft_project_evaluation_rubric_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, Auto-increment (主键, 自增)',
  `draft_id` BIGINT NOT NULL COMMENT 'Draft Project ID (草稿项目ID)',
  `user_id` BIGINT NOT NULL COMMENT 'User ID (用户ID)',
  `round` INT NOT NULL COMMENT 'Round (轮次)',
  `user_input` TEXT COMMENT 'User revision comments/dialog content (用户修订意见/对话内容)',
  `ai_output` TEXT COMMENT 'AI-generated evaluation standards (JSON) (AI生成的评价标准 (JSON))',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time (创建时间)',
  PRIMARY KEY (`id`),
  KEY `idx_draft_project_evaluation_rubric_history_draft_id` (`draft_id`),
  KEY `idx_draft_project_evaluation_rubric_history_user_id` (`user_id`),
  KEY `idx_draft_project_evaluation_rubric_history_round` (`round`),
  KEY `idx_draft_project_evaluation_rubric_history_created_at` (`created_at`),
  CONSTRAINT `draft_project_evaluation_rubric_history_ibfk_1` FOREIGN KEY (`draft_id`) REFERENCES `draft_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Draft Project Evaluation Rubric History Table (草稿项目评价标准历史表)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `draft_project_evaluation_rubric_history`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `draft_project_task_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, Auto-increment (主键, 自增)',
  `draft_id` BIGINT NOT NULL COMMENT 'Draft Project ID (草稿项目ID)',
  `user_id` BIGINT NOT NULL COMMENT 'User ID (用户ID)',
  `round` INT NOT NULL COMMENT 'Round (轮次)',CONSTRAINT `fk_teachers_project` FOREIGN KEY (`project_id_created`) REFERENCES `projects` (`id`) ON DELETE SET NULL
  `user_input` TEXT COMMENT 'User revision comments/dialog content (用户修订意见/对话内容)',
  `ai_output` TEXT COMMENT 'AI-generated tasks (JSON) (AI生成的任务 (JSON))',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time (创建时间)',
  PRIMARY KEY (`id`),
  KEY `idx_draft_project_task_history_draft_id` (`draft_id`),
  KEY `idx_draft_project_task_history_user_id` (`user_id`),
  KEY `idx_draft_project_task_history_round` (`round`),
  KEY `idx_draft_project_task_history_created_at` (`created_at`),
  CONSTRAINT `draft_project_task_history_ibfk_1` FOREIGN KEY (`draft_id`) REFERENCES `draft_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Draft Project Task History Table (草稿项目任务历史表)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `draft_project_task_history`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `teacher_subjects` (
  `teacher_id` int NOT NULL,
  `subject_id` int NOT NULL,
  PRIMARY KEY (`teacher_id`,`subject_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `teacher_subjects_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_subjects`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grade` int DEFAULT NULL,
  `project_id_created` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_teachers_project` (`project_id_created`),
  CONSTRAINT `fk_teachers_project` FOREIGN KEY (`project_id_created`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE if not exists `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` enum('teacher','student') COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `real_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `teacher_id` (`teacher_id`),
  KEY `idx_email` (`email`),
  KEY `idx_username` (`username`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_chk_1` CHECK ((((`role` = _utf8mb4'student') and (`student_id` is not null) and (`teacher_id` is null)) or ((`role` = _utf8mb4'teacher') and (`teacher_id` is not null) and (`student_id` is null))))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-22  9:24:04
