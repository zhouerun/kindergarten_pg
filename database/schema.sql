-- 创建数据库
CREATE DATABASE IF NOT EXISTS kindergarten_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kindergarten_system;

-- 班级表
CREATE TABLE classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  teacher_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role ENUM('teacher', 'parent') NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  child_id INT DEFAULT NULL,
  class_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 添加班级表的外键约束
ALTER TABLE classes ADD FOREIGN KEY (teacher_id) REFERENCES users(id);

-- 孩子档案表
CREATE TABLE children (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  class_id INT NOT NULL,
  features JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 照片表
CREATE TABLE photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  path VARCHAR(255) NOT NULL,
  uploader_id INT NOT NULL,
  class_id INT NOT NULL,
  is_public tinyint(1) DEFAULT 1,
  recognition_data JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploader_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 家长-孩子关联表
CREATE TABLE parent_child (
  parent_id INT NOT NULL,
  child_id INT NOT NULL,
  PRIMARY KEY (parent_id, child_id),
  FOREIGN KEY (parent_id) REFERENCES users(id),
  FOREIGN KEY (child_id) REFERENCES children(id)
);

-- 点赞记录表
CREATE TABLE likes (
  user_id INT NOT NULL,
  photo_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, photo_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (photo_id) REFERENCES photos(id)
); 