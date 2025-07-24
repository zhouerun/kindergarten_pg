-- 数据迁移脚本：从 ai_pbl 迁移到 ai_pbl_new
-- 执行前请确保已创建新数据库 ai_pbl_new 并执行了表结构创建脚本

USE ai_pbl_new;

-- 临时禁用外键约束检查，避免迁移过程中的外键约束错误
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 迁移 subjects 表数据
INSERT INTO subjects (id, name) 
SELECT id, name FROM ai_pbl.subjects 
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. 迁移 students 表数据
INSERT INTO students (id, grade, class, school) 
SELECT id, grade, class, school FROM ai_pbl.students 
ON DUPLICATE KEY UPDATE 
    grade = VALUES(grade),
    class = VALUES(class),
    school = VALUES(school);

-- 3. 迁移 users 表数据
INSERT INTO users (id, role, username, password, email, real_name, phone, student_id, teacher_id, created_at, updated_at) 
SELECT id, role, username, password, email, real_name, phone, student_id, teacher_id, created_at, updated_at 
FROM ai_pbl.users 
ON DUPLICATE KEY UPDATE 
    role = VALUES(role),
    username = VALUES(username),
    password = VALUES(password),
    email = VALUES(email),
    real_name = VALUES(real_name),
    phone = VALUES(phone),
    student_id = VALUES(student_id),
    teacher_id = VALUES(teacher_id),
    created_at = VALUES(created_at),
    updated_at = VALUES(updated_at);

-- 4. 迁移 projects 表数据（注意新表结构变化）
INSERT INTO projects (id, title, description, difficulty, grade_level, thumbnail, images, objectives, participant_count, created_at, updated_at) 
SELECT 
    id, 
    title, 
    description, 
    difficulty, 
    grade_level, 
    thumbnail, 
    images, 
    objectives, 
    participant_count, 
    created_at, 
    updated_at 
FROM ai_pbl.projects 
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    grade_level = VALUES(grade_level),
    thumbnail = VALUES(thumbnail),
    images = VALUES(images),
    objectives = VALUES(objectives),
    participant_count = VALUES(participant_count),
    created_at = VALUES(created_at),
    updated_at = VALUES(updated_at);

-- 5. 迁移 teachers 表数据（注意新表结构变化）
INSERT INTO teachers (id, grade, project_id_created) 
SELECT id, grade, project_id_created FROM ai_pbl.teachers 
ON DUPLICATE KEY UPDATE 
    grade = VALUES(grade),
    project_id_created = VALUES(project_id_created);

-- 6. 迁移 project_steps 表数据（注意新表结构变化）
INSERT INTO project_steps (id, project_id, steps_order, title, task_objectives, created_at) 
SELECT 
    id, 
    project_id, 
    steps_order, 
    title, 
    task_objectives, 
    created_at 
FROM ai_pbl.project_steps 
ON DUPLICATE KEY UPDATE 
    project_id = VALUES(project_id),
    steps_order = VALUES(steps_order),
    title = VALUES(title),
    task_objectives = VALUES(task_objectives),
    created_at = VALUES(created_at);

-- 7. 迁移 activities 表数据（注意新表结构变化）
INSERT INTO activities (id, project_id, project_steps_id, activity_order, description) 
SELECT 
    id, 
    project_id, 
    project_steps_id, 
    activity_order, 
    description 
FROM ai_pbl.activities 
ON DUPLICATE KEY UPDATE 
    project_id = VALUES(project_id),
    project_steps_id = VALUES(project_steps_id),
    activity_order = VALUES(activity_order),
    description = VALUES(description);

-- 8. 迁移 answers 表数据（注意新表结构变化）
INSERT INTO answers (id, student_id, project_id, project_steps_id, activity_id, text_answer, is_correct, feedback, answered_at) 
SELECT 
    id, 
    student_id, 
    project_id, 
    project_steps_id, 
    activity_id, 
    text_answer, 
    is_correct, 
    feedback, 
    answered_at 
FROM ai_pbl.answers 
ON DUPLICATE KEY UPDATE 
    student_id = VALUES(student_id),
    project_id = VALUES(project_id),
    project_steps_id = VALUES(project_steps_id),
    activity_id = VALUES(activity_id),
    text_answer = VALUES(text_answer),
    is_correct = VALUES(is_correct),
    feedback = VALUES(feedback),
    answered_at = VALUES(answered_at);

-- 9. 迁移 project_subjects 表数据
INSERT INTO project_subjects (project_id, subject_id) 
SELECT project_id, subject_id FROM ai_pbl.project_subjects 
ON DUPLICATE KEY UPDATE 
    project_id = VALUES(project_id),
    subject_id = VALUES(subject_id);

-- 10. 迁移 teacher_subjects 表数据
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT teacher_id, subject_id FROM ai_pbl.teacher_subjects 
ON DUPLICATE KEY UPDATE 
    teacher_id = VALUES(teacher_id),
    subject_id = VALUES(subject_id);

-- 11. 迁移 teacher_projects 表数据
INSERT INTO teacher_projects (teacher_id, project_id) 
SELECT teacher_id, project_id FROM ai_pbl.teacher_projects 
ON DUPLICATE KEY UPDATE 
    teacher_id = VALUES(teacher_id),
    project_id = VALUES(project_id);

-- 12. 迁移 student_teachers 表数据
INSERT INTO student_teachers (student_id, teacher_id) 
SELECT student_id, teacher_id FROM ai_pbl.student_teachers 
ON DUPLICATE KEY UPDATE 
    student_id = VALUES(student_id),
    teacher_id = VALUES(teacher_id);

-- 13. 迁移 student_answers 表数据
INSERT INTO student_answers (student_id, answer_id) 
SELECT student_id, answer_id FROM ai_pbl.student_answers 
ON DUPLICATE KEY UPDATE 
    student_id = VALUES(student_id),
    answer_id = VALUES(answer_id);

-- 14. 迁移 student_projects 表数据（注意新表结构变化）
INSERT INTO student_projects (student_id, project_id, status, progress, started_at, completed_at) 
SELECT 
    student_id, 
    project_id, 
    status, 
    progress, 
    started_at, 
    completed_at 
FROM ai_pbl.student_projects 
ON DUPLICATE KEY UPDATE 
    status = VALUES(status),
    progress = VALUES(progress),
    started_at = VALUES(started_at),
    completed_at = VALUES(completed_at);

-- 15. 迁移 reports 表数据
INSERT INTO reports (id, student_id, project_id, evaluation, score1, score2, score3, score4, score5) 
SELECT 
    id, 
    student_id, 
    project_id, 
    evaluation, 
    score1, 
    score2, 
    score3, 
    score4, 
    score5 
FROM ai_pbl.reports 
ON DUPLICATE KEY UPDATE 
    student_id = VALUES(student_id),
    project_id = VALUES(project_id),
    evaluation = VALUES(evaluation),
    score1 = VALUES(score1),
    score2 = VALUES(score2),
    score3 = VALUES(score3),
    score4 = VALUES(score4),
    score5 = VALUES(score5);

-- 重新启用外键约束检查
SET FOREIGN_KEY_CHECKS = 1;

-- 验证迁移结果
SELECT 'Migration completed successfully!' as status;

-- 显示各表的记录数统计
SELECT 'subjects' as table_name, COUNT(*) as record_count FROM subjects
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'project_steps', COUNT(*) FROM project_steps
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'answers', COUNT(*) FROM answers
UNION ALL
SELECT 'project_subjects', COUNT(*) FROM project_subjects
UNION ALL
SELECT 'teacher_subjects', COUNT(*) FROM teacher_subjects
UNION ALL
SELECT 'teacher_projects', COUNT(*) FROM teacher_projects
UNION ALL
SELECT 'student_teachers', COUNT(*) FROM student_teachers
UNION ALL
SELECT 'student_answers', COUNT(*) FROM student_answers
UNION ALL
SELECT 'student_projects', COUNT(*) FROM student_projects
UNION ALL
SELECT 'reports', COUNT(*) FROM reports; 