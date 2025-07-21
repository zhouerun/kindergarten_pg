-- 为children表添加age字段
USE kindergarten_system;

-- 添加age字段到children表
ALTER TABLE children ADD COLUMN age INT DEFAULT NULL AFTER student_number;

-- 更新现有记录的age字段（如果需要的话，可以设置默认值）
-- UPDATE children SET age = 5 WHERE age IS NULL; 