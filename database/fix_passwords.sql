-- 修复测试账号密码脚本
-- 使用bcrypt生成的123456密码哈希值

USE kindergarten_system;

-- 先查看当前用户
SELECT username, role, full_name, 
       CASE 
           WHEN password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' THEN '需要更新'
           ELSE '密码已更新'
       END as status
FROM users 
WHERE username IN ('teacher1', 'parent1');

-- 更新密码为123456的正确哈希值
-- 这个哈希值对应密码"123456"
UPDATE users 
SET password = '$2a$10$E9/1K4aLJkHmQZlTgdhNqe4XPvPxZJgQZqHkCOcXQkzYCzYQhqhsu' 
WHERE username IN ('teacher1', 'teacher2', 'teacher3', 'parent1', 'parent2', 'parent3', 'parent4', 'parent5', 'parent6', 'parent7', 'parent8', 'parent9', 'parent10');

-- 验证更新结果
SELECT username, role, full_name, 
       CASE 
           WHEN password = '$2a$10$E9/1K4aLJkHmQZlTgdhNqe4XPvPxZJgQZqHkCOcXQkzYCzYQhqhsu' THEN '✅ 密码已更新'
           ELSE '❌ 密码未更新'
       END as status
FROM users 
WHERE username IN ('teacher1', 'parent1');

-- 显示完成信息
SELECT '✅ 密码修复完成！' as message;
SELECT '🔑 测试账号信息：' as info;
SELECT '   用户名: teacher1, 密码: 123456' as teacher_info;
SELECT '   用户名: parent1, 密码: 123456' as parent_info; 