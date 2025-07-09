-- 幼儿园家校沟通系统数据库设置脚本
-- 使用方法：mysql -u root -p < database/setup.sql

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

-- 添加外键约束
ALTER TABLE classes ADD FOREIGN KEY (teacher_id) REFERENCES users(id);

-- 插入初始数据
-- 插入教师用户
INSERT INTO users (username, password, role, full_name, class_id) VALUES
('teacher1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', '张老师', NULL),
('teacher2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', '李老师', NULL),
('teacher3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', '王老师', NULL);

-- 插入班级数据
INSERT INTO classes (name, teacher_id) VALUES
('小一班', 1),
('小二班', 2);

-- 更新教师的班级关联
UPDATE users SET class_id = 1 WHERE id = 1;
UPDATE users SET class_id = 2 WHERE id = 2;

-- 插入学生数据
INSERT INTO children (name, class_id) VALUES
-- 小一班学生
('陈小明', 1), ('李小红', 1), ('王小华', 1), ('张小丽', 1), ('刘小强', 1),
('赵小芳', 1), ('孙小军', 1), ('周小燕', 1), ('吴小勇', 1), ('郑小美', 1),
-- 小二班学生
('胡小刚', 2), ('朱小玲', 2), ('林小峰', 2), ('罗小霞', 2), ('梁小辉', 2),
('谢小娟', 2), ('蔡小鹏', 2), ('邓小雯', 2), ('薛小东', 2), ('曹小兰', 2);

-- 插入家长用户
INSERT INTO users (username, password, role, full_name) VALUES
('parent1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '陈先生'),
('parent2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '李女士'),
('parent3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '王先生'),
('parent4', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '张女士'),
('parent5', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '刘先生'),
('parent6', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '赵女士'),
('parent7', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '孙先生'),
('parent8', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '周女士'),
('parent9', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '吴先生'),
('parent10', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '郑女士');

-- 插入家长-孩子关联数据
INSERT INTO parent_child (parent_id, child_id) VALUES
(4, 1), (5, 2), (6, 3), (7, 4), (8, 5),
(9, 6), (10, 7), (11, 8), (12, 9), (13, 10);

-- 插入照片数据（模拟）
INSERT INTO photos (path, uploader_id, class_id, is_public, recognition_data) VALUES
-- 小一班照片
('/uploads/class1_photo1.jpg', 1, 1, true, '{"child_ids": [1, 2], "confidence": 0.95}'),
('/uploads/class1_photo2.jpg', 1, 1, true, '{"child_ids": [3], "confidence": 0.92}'),
('/uploads/class1_photo3.jpg', 1, 1, true, '{"child_ids": [4, 5, 6], "confidence": 0.88}'),
('/uploads/class1_photo4.jpg', 1, 1, false, '{"child_ids": [1], "confidence": 0.97}'),
('/uploads/class1_photo5.jpg', 1, 1, true, '{"child_ids": [7, 8], "confidence": 0.91}'),
('/uploads/class1_photo6.jpg', 1, 1, true, '{"child_ids": [9, 10], "confidence": 0.94}'),
('/uploads/class1_photo7.jpg', 1, 1, true, '{"child_ids": [2, 3, 4], "confidence": 0.89}'),
('/uploads/class1_photo8.jpg', 1, 1, false, '{"child_ids": [5], "confidence": 0.96}'),
('/uploads/class1_photo9.jpg', 1, 1, true, '{"child_ids": [6, 7], "confidence": 0.93}'),
('/uploads/class1_photo10.jpg', 1, 1, true, '{"child_ids": [8], "confidence": 0.90}'),
('/uploads/class1_photo11.jpg', 1, 1, true, '{"child_ids": [9], "confidence": 0.92}'),
('/uploads/class1_photo12.jpg', 1, 1, false, '{"child_ids": [10, 1], "confidence": 0.87}'),
('/uploads/class1_photo13.jpg', 1, 1, true, '{"child_ids": [2], "confidence": 0.95}'),
('/uploads/class1_photo14.jpg', 1, 1, true, '{"child_ids": [3, 4], "confidence": 0.91}'),
('/uploads/class1_photo15.jpg', 1, 1, true, '{"child_ids": [5, 6, 7], "confidence": 0.86}'),

-- 小二班照片
('/uploads/class2_photo1.jpg', 2, 2, true, '{"child_ids": [11, 12], "confidence": 0.94}'),
('/uploads/class2_photo2.jpg', 2, 2, true, '{"child_ids": [13], "confidence": 0.93}'),
('/uploads/class2_photo3.jpg', 2, 2, true, '{"child_ids": [14, 15], "confidence": 0.89}'),
('/uploads/class2_photo4.jpg', 2, 2, false, '{"child_ids": [16], "confidence": 0.96}'),
('/uploads/class2_photo5.jpg', 2, 2, true, '{"child_ids": [17, 18], "confidence": 0.92}'),
('/uploads/class2_photo6.jpg', 2, 2, true, '{"child_ids": [19, 20], "confidence": 0.90}'),
('/uploads/class2_photo7.jpg', 2, 2, true, '{"child_ids": [11, 13], "confidence": 0.88}'),
('/uploads/class2_photo8.jpg', 2, 2, false, '{"child_ids": [14], "confidence": 0.95}'),
('/uploads/class2_photo9.jpg', 2, 2, true, '{"child_ids": [15, 16], "confidence": 0.91}'),
('/uploads/class2_photo10.jpg', 2, 2, true, '{"child_ids": [17], "confidence": 0.93}'),
('/uploads/class2_photo11.jpg', 2, 2, true, '{"child_ids": [18, 19], "confidence": 0.87}'),
('/uploads/class2_photo12.jpg', 2, 2, false, '{"child_ids": [20], "confidence": 0.94}'),
('/uploads/class2_photo13.jpg', 2, 2, true, '{"child_ids": [11, 12, 13], "confidence": 0.85}'),
('/uploads/class2_photo14.jpg', 2, 2, true, '{"child_ids": [14, 15], "confidence": 0.92}'),
('/uploads/class2_photo15.jpg', 2, 2, true, '{"child_ids": [16, 17], "confidence": 0.90}');

-- 插入点赞数据
INSERT INTO likes (user_id, photo_id) VALUES
-- 家长给照片点赞
(4, 1), (4, 4), (4, 7), (4, 12),
(5, 1), (5, 2), (5, 13),
(6, 3), (6, 7), (6, 14),
(7, 3), (7, 4), (7, 14),
(8, 5), (8, 8), (8, 15),
(9, 6), (9, 9), (9, 15),
(10, 6), (10, 10),
(11, 9), (11, 11),
(12, 10), (12, 12),
(13, 11), (13, 13);

-- 显示设置完成信息
SELECT '数据库设置完成！' as message;
SELECT '测试账号：' as info;
SELECT 'teacher1/123456 - 张老师' as teacher_account;
SELECT 'parent1/123456 - 陈先生' as parent_account;

-- 显示统计信息
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teachers,
    (SELECT COUNT(*) FROM users WHERE role = 'parent') as parents,
    (SELECT COUNT(*) FROM classes) as classes,
    (SELECT COUNT(*) FROM children) as students,
    (SELECT COUNT(*) FROM photos) as photos,
    (SELECT COUNT(*) FROM likes) as likes; 