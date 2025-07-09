-- 更新所有测试账号的密码为正确的bcrypt哈希值
-- 这将解决登录401错误问题

USE kindergarten_system;

-- 查看当前用户状态
SELECT username, role, full_name, 
       CASE 
           WHEN LENGTH(password) > 20 THEN 'bcrypt哈希密码'
           ELSE '明文密码（需要更新）'
       END as password_type
FROM users 
ORDER BY username;

-- 更新所有测试账号的密码为正确的bcrypt哈希值（对应明文密码：123456）
UPDATE users 
SET password = '$2a$10$ot0wF9chNf5LvL6DlPVHrOSBEGO1gd8zAYqSZEq1RkxvxonIvRcTm' 
WHERE username IN ('teacher1', 'teacher2', 'teacher3', 'parent1', 'parent2', 'parent3', 'parent4', 'parent5', 'parent6', 'parent7', 'parent8', 'parent9', 'parent10');

-- 验证更新结果
SELECT username, role, full_name, 
       CASE 
           WHEN password = '$2a$10$ot0wF9chNf5LvL6DlPVHrOSBEGO1gd8zAYqSZEq1RkxvxonIvRcTm' THEN '✅ 密码已更新为正确的bcrypt哈希'
           ELSE '❌ 密码未正确更新'
       END as status
FROM users 
WHERE username IN ('teacher1', 'teacher2', 'teacher3', 'parent1', 'parent2', 'parent3', 'parent4', 'parent5', 'parent6', 'parent7', 'parent8', 'parent9', 'parent10')
ORDER BY username;

-- 显示完成信息
SELECT '✅ 密码修复完成！' as message;
SELECT '🔑 测试账号信息：' as info;
SELECT '   用户名: teacher1, 密码: 123456' as teacher_info;
SELECT '   用户名: parent1, 密码: 123456' as parent_info;
SELECT '   所有测试账号密码统一为: 123456' as all_accounts_info;
SELECT '🔒 使用安全的bcrypt哈希存储' as security_info; 