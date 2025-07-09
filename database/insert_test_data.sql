-- 插入测试数据
USE kindergarten_system;

-- 插入班级数据
INSERT INTO classes (name, teacher_id) VALUES
  ('小一班', 1),
  ('小二班', 1),
  ('中一班', 1);

-- 插入孩子数据
INSERT INTO children (name, class_id) VALUES
  ('张小明', 1),
  ('李小红', 1),
  ('王小刚', 1),
  ('赵小美', 2),
  ('陈小华', 2),
  ('刘小强', 3);

-- 插入家长-孩子关联
INSERT INTO parent_child (parent_id, child_id) VALUES
  (2, 1),  -- parent1 -> 张小明
  (2, 2),  -- parent1 -> 李小红
  (3, 3),  -- parent2 -> 王小刚
  (4, 4),  -- parent3 -> 赵小美
  (5, 5),  -- parent4 -> 陈小华
  (6, 6);  -- parent5 -> 刘小强

-- 插入一些测试照片
INSERT INTO photos (path, uploader_id, class_id, is_public, recognition_data) VALUES
  ('/uploads/photo1.jpg', 1, 1, 1, '{"child_ids": [1, 2], "confidence": 0.9}'),
  ('/uploads/photo2.jpg', 1, 1, 1, '{"child_ids": [3], "confidence": 0.8}'),
  ('/uploads/photo3.jpg', 1, 2, 1, '{"child_ids": [4, 5], "confidence": 0.85}'),
  ('/uploads/photo4.jpg', 1, 3, 1, '{"child_ids": [6], "confidence": 0.92}'),
  ('/uploads/photo5.jpg', 1, 1, 0, '{"child_ids": [1], "confidence": 0.88}'); 