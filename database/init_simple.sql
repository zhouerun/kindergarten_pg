-- 幼儿园系统数据库初始化脚本（简化版）
-- 使用方法：在MySQL中逐行执行或导入此文件

-- 创建数据库
CREATE DATABASE IF NOT EXISTS kindergarten_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE kindergarten_system;

-- 删除已存在的表（如果存在）
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS parent_child;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;

-- 创建用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role ENUM('teacher', 'parent') NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  child_id INT DEFAULT NULL,
  class_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建班级表
CREATE TABLE classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建孩子档案表
CREATE TABLE children (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  class_id INT NOT NULL,
  features JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 创建照片表
CREATE TABLE photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  path VARCHAR(255) NOT NULL,
  uploader_id INT NOT NULL,
  class_id INT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  recognition_data JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploader_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 创建家长-孩子关联表
CREATE TABLE parent_child (
  parent_id INT NOT NULL,
  child_id INT NOT NULL,
  PRIMARY KEY (parent_id, child_id),
  FOREIGN KEY (parent_id) REFERENCES users(id),
  FOREIGN KEY (child_id) REFERENCES children(id)
);

-- 创建点赞记录表
CREATE TABLE likes (
  user_id INT NOT NULL,
  photo_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, photo_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (photo_id) REFERENCES photos(id)
);

-- 插入测试用户（密码：123456）
INSERT INTO users (username, password, role, full_name, class_id) VALUES
('teacher1', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8/E2g.5Rn8A.8QnJB8g0QqW5WjrSZq', 'teacher', '张老师', NULL),
('teacher2', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8/E2g.5Rn8A.8QnJB8g0QqW5WjrSZq', 'teacher', '李老师', NULL),
('parent1', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8/E2g.5Rn8A.8QnJB8g0QqW5WjrSZq', 'parent', '陈先生', NULL),
('parent2', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8/E2g.5Rn8A.8QnJB8g0QqW5WjrSZq', 'parent', '李女士', NULL);

-- 插入班级数据
INSERT INTO classes (name, teacher_id) VALUES
('小一班', 1),
('小二班', 2);

-- 更新教师的班级关联
UPDATE users SET class_id = 1 WHERE id = 1;
UPDATE users SET class_id = 2 WHERE id = 2;

-- 插入学生数据
INSERT INTO children (name, class_id) VALUES
('陈小明', 1), ('李小红', 1), ('王小华', 1), ('张小丽', 1),
('刘小强', 2), ('赵小芳', 2), ('孙小军', 2), ('周小燕', 2);

-- 插入家长-孩子关联
INSERT INTO parent_child (parent_id, child_id) VALUES
(3, 1), (4, 2), (3, 3), (4, 4);

-- 插入示例照片
INSERT INTO photos (path, uploader_id, class_id, is_public, recognition_data) VALUES
('/uploads/class1_photo1.jpg', 1, 1, 1, '{"child_ids": [1, 2], "confidence": 0.95}'),
('/uploads/class1_photo2.jpg', 1, 1, 1, '{"child_ids": [3], "confidence": 0.92}'),
('/uploads/class2_photo1.jpg', 2, 2, 1, '{"child_ids": [5, 6], "confidence": 0.94}'),
('/uploads/class2_photo2.jpg', 2, 2, 1, '{"child_ids": [7], "confidence": 0.93}');

-- 添加外键约束
ALTER TABLE classes ADD FOREIGN KEY (teacher_id) REFERENCES users(id);

-- 显示初始化结果
SELECT '✅ 数据库初始化完成！' as message;
SELECT '🔑 测试账号：' as info;
SELECT 'teacher1/123456 - 张老师' as teacher_account;
SELECT 'parent1/123456 - 陈先生' as parent_account;

-- 显示数据统计
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teachers,
    (SELECT COUNT(*) FROM users WHERE role = 'parent') as parents,
    (SELECT COUNT(*) FROM classes) as classes,
    (SELECT COUNT(*) FROM children) as students,
    (SELECT COUNT(*) FROM photos) as photos; 