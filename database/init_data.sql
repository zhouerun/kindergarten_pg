-- 初始化测试数据
USE kindergarten_system;

-- 插入班级数据
INSERT INTO classes (name) VALUES 
('小一班'), 
('小二班');

-- 插入教师用户数据 (密码: 123456)
INSERT INTO users (username, password, role, full_name, class_id) VALUES 
('teacher1', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'teacher', '张老师', 1),
('teacher2', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'teacher', '李老师', 2),
('teacher3', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'teacher', '王老师', 1);

-- 更新班级表的teacher_id
UPDATE classes SET teacher_id = 1 WHERE id = 1;
UPDATE classes SET teacher_id = 2 WHERE id = 2;

-- 插入学生数据
INSERT INTO children (name, class_id) VALUES 
-- 小一班学生
('陈小明', 1), ('王小红', 1), ('刘小强', 1), ('赵小美', 1), ('孙小亮', 1),
('周小花', 1), ('吴小军', 1), ('郑小丽', 1), ('朱小刚', 1), ('徐小慧', 1),
-- 小二班学生
('马小东', 2), ('冯小西', 2), ('陈小南', 2), ('林小北', 2), ('杨小春', 2),
('何小夏', 2), ('罗小秋', 2), ('高小冬', 2), ('梁小晴', 2), ('谢小雨', 2);

-- 插入家长用户数据 (密码: 123456)
INSERT INTO users (username, password, role, full_name) VALUES 
('parent1', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '陈爸爸'),
('parent2', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '王妈妈'),
('parent3', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '刘爸爸'),
('parent4', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '赵妈妈'),
('parent5', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '孙爸爸'),
('parent6', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '周妈妈'),
('parent7', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '吴爸爸'),
('parent8', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '郑妈妈'),
('parent9', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '朱爸爸'),
('parent10', '$2b$10$8yGzgKSEQbFHZfhqBzpZJuQ7RZyZFRMPgRj8OB.7nKoRLfKWpkSjG', 'parent', '徐妈妈');

-- 插入家长-孩子关联数据
INSERT INTO parent_child (parent_id, child_id) VALUES 
(4, 1), (5, 2), (6, 3), (7, 4), (8, 5), (9, 6), (10, 7), (11, 8), (12, 9), (13, 10),
(4, 11), (5, 12), (6, 13), (7, 14), (8, 15), (9, 16), (10, 17), (11, 18), (12, 19), (13, 20);

-- 插入模拟照片数据
INSERT INTO photos (path, uploader_id, class_id, is_public, recognition_data) VALUES 
-- 小一班照片
('/uploads/class1_photo1.jpg', 1, 1, true, '{"child_ids": [1, 2, 3], "confidence": 0.92}'),
('/uploads/class1_photo2.jpg', 1, 1, true, '{"child_ids": [4, 5], "confidence": 0.88}'),
('/uploads/class1_photo3.jpg', 1, 1, true, '{"child_ids": [6], "confidence": 0.95}'),
('/uploads/class1_photo4.jpg', 1, 1, true, '{"child_ids": [7, 8, 9], "confidence": 0.89}'),
('/uploads/class1_photo5.jpg', 1, 1, true, '{"child_ids": [10], "confidence": 0.93}'),
('/uploads/class1_photo6.jpg', 1, 1, true, '{"child_ids": [1, 4, 7], "confidence": 0.87}'),
('/uploads/class1_photo7.jpg', 1, 1, true, '{"child_ids": [2, 5, 8], "confidence": 0.91}'),
('/uploads/class1_photo8.jpg', 1, 1, true, '{"child_ids": [3, 6, 9], "confidence": 0.90}'),
('/uploads/class1_photo9.jpg', 1, 1, true, '{"child_ids": [1, 10], "confidence": 0.94}'),
('/uploads/class1_photo10.jpg', 1, 1, true, '{"child_ids": [2, 3, 4, 5], "confidence": 0.86}'),
('/uploads/class1_photo11.jpg', 1, 1, true, '{"child_ids": [6, 7, 8], "confidence": 0.88}'),
('/uploads/class1_photo12.jpg', 1, 1, true, '{"child_ids": [9, 10], "confidence": 0.92}'),
('/uploads/class1_photo13.jpg', 1, 1, true, '{"child_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "confidence": 0.85}'),
('/uploads/class1_photo14.jpg', 1, 1, true, '{"child_ids": [1, 3, 5, 7, 9], "confidence": 0.89}'),
('/uploads/class1_photo15.jpg', 1, 1, true, '{"child_ids": [2, 4, 6, 8, 10], "confidence": 0.87}'),
-- 小二班照片
('/uploads/class2_photo1.jpg', 2, 2, true, '{"child_ids": [11, 12, 13], "confidence": 0.91}'),
('/uploads/class2_photo2.jpg', 2, 2, true, '{"child_ids": [14, 15], "confidence": 0.93}'),
('/uploads/class2_photo3.jpg', 2, 2, true, '{"child_ids": [16], "confidence": 0.96}'),
('/uploads/class2_photo4.jpg', 2, 2, true, '{"child_ids": [17, 18, 19], "confidence": 0.88}'),
('/uploads/class2_photo5.jpg', 2, 2, true, '{"child_ids": [20], "confidence": 0.94}'),
('/uploads/class2_photo6.jpg', 2, 2, true, '{"child_ids": [11, 14, 17], "confidence": 0.86}'),
('/uploads/class2_photo7.jpg', 2, 2, true, '{"child_ids": [12, 15, 18], "confidence": 0.90}'),
('/uploads/class2_photo8.jpg', 2, 2, true, '{"child_ids": [13, 16, 19], "confidence": 0.89}'),
('/uploads/class2_photo9.jpg', 2, 2, true, '{"child_ids": [11, 20], "confidence": 0.92}'),
('/uploads/class2_photo10.jpg', 2, 2, true, '{"child_ids": [12, 13, 14, 15], "confidence": 0.87}'),
('/uploads/class2_photo11.jpg', 2, 2, true, '{"child_ids": [16, 17, 18], "confidence": 0.91}'),
('/uploads/class2_photo12.jpg', 2, 2, true, '{"child_ids": [19, 20], "confidence": 0.95}'),
('/uploads/class2_photo13.jpg', 2, 2, true, '{"child_ids": [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], "confidence": 0.84}'),
('/uploads/class2_photo14.jpg', 2, 2, true, '{"child_ids": [11, 13, 15, 17, 19], "confidence": 0.88}'),
('/uploads/class2_photo15.jpg', 2, 2, true, '{"child_ids": [12, 14, 16, 18, 20], "confidence": 0.90}');

-- 插入一些点赞数据
INSERT INTO likes (user_id, photo_id) VALUES 
(4, 1), (5, 1), (6, 1),
(4, 2), (7, 2),
(9, 3), (10, 3), (11, 3),
(4, 16), (5, 16), (6, 16),
(7, 17), (8, 17); 