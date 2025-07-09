const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// 获取所有班级
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [classes] = await pool.execute(`
      SELECT c.id, c.name, c.created_at, u.full_name as teacher_name,
             COUNT(ch.id) as student_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN children ch ON c.id = ch.class_id
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json(classes);
  } catch (error) {
    console.error('获取班级列表错误:', error);
    res.status(500).json({ error: '获取班级列表失败' });
  }
});

// 获取所有学生
router.get('/students', authenticateToken, async (req, res) => {
  try {
    const [students] = await pool.execute(`
      SELECT c.id, c.name, c.class_id, c.created_at,
             cl.name as class_name
      FROM children c
      LEFT JOIN classes cl ON c.class_id = cl.id
      ORDER BY cl.name, c.name
    `);

    res.json(students);
  } catch (error) {
    console.error('获取学生列表错误:', error);
    res.status(500).json({ error: '获取学生列表失败' });
  }
});

// 添加学生（教师可用）
router.post('/students', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const { name, class_id } = req.body;

    if (!name || !class_id) {
      return res.status(400).json({ error: '学生姓名和班级ID不能为空' });
    }

    // 检查班级是否存在
    const [classes] = await pool.execute(
      'SELECT id FROM classes WHERE id = ?',
      [class_id]
    );

    if (classes.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // 检查学生是否已存在
    const [existingChild] = await pool.execute(
      'SELECT id FROM children WHERE name = ? AND class_id = ?',
      [name, class_id]
    );

    if (existingChild.length > 0) {
      return res.status(400).json({ error: '该学生已存在于班级中' });
    }

    // 添加学生
    const [result] = await pool.execute(
      'INSERT INTO children (name, class_id) VALUES (?, ?)',
      [name, class_id]
    );

    res.status(201).json({
      message: '学生添加成功',
      child: {
        id: result.insertId,
        name,
        class_id
      }
    });
  } catch (error) {
    console.error('添加学生错误:', error);
    res.status(500).json({ error: '添加学生失败' });
  }
});

// 更新学生信息（教师可用）
router.put('/students/:id', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const studentId = req.params.id;
    const { name, class_id } = req.body;

    if (!name || !class_id) {
      return res.status(400).json({ error: '学生姓名和班级ID不能为空' });
    }

    // 检查学生是否存在
    const [existingStudent] = await pool.execute(
      'SELECT id FROM children WHERE id = ?',
      [studentId]
    );

    if (existingStudent.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 检查班级是否存在
    const [classes] = await pool.execute(
      'SELECT id FROM classes WHERE id = ?',
      [class_id]
    );

    if (classes.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // 更新学生信息
    await pool.execute(
      'UPDATE children SET name = ?, class_id = ? WHERE id = ?',
      [name, class_id, studentId]
    );

    res.json({ message: '学生信息更新成功' });
  } catch (error) {
    console.error('更新学生信息错误:', error);
    res.status(500).json({ error: '更新学生信息失败' });
  }
});

// 删除学生（教师可用）
router.delete('/students/:id', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const studentId = req.params.id;

    // 检查学生是否存在
    const [student] = await pool.execute(
      'SELECT id FROM children WHERE id = ?',
      [studentId]
    );

    if (student.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 删除学生（注意：这里可能需要处理相关的外键约束）
    await pool.execute('DELETE FROM children WHERE id = ?', [studentId]);

    res.json({ message: '学生删除成功' });
  } catch (error) {
    console.error('删除学生错误:', error);
    res.status(500).json({ error: '删除学生失败' });
  }
});

// 获取班级详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.id;
    
    // 获取班级基本信息
    const [classes] = await pool.execute(`
      SELECT c.id, c.name, c.created_at, u.full_name as teacher_name, u.id as teacher_id
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `, [classId]);

    if (classes.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const classInfo = classes[0];

    // 获取班级学生
    const [students] = await pool.execute(`
      SELECT id, name, created_at
      FROM children
      WHERE class_id = ?
      ORDER BY name
    `, [classId]);

    // 获取班级照片数量
    const [photoCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM photos WHERE class_id = ?',
      [classId]
    );

    res.json({
      ...classInfo,
      students,
      photo_count: photoCount[0].count
    });
  } catch (error) {
    console.error('获取班级详情错误:', error);
    res.status(500).json({ error: '获取班级详情失败' });
  }
});

// 获取班级学生
router.get('/:id/children', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 权限检查：教师只能查看自己班级的学生
    if (userRole === 'teacher' && req.user.class_id != classId) {
      return res.status(403).json({ error: '无权查看该班级学生' });
    }

    const [children] = await pool.execute(`
      SELECT id, name, created_at
      FROM children
      WHERE class_id = ?
      ORDER BY name
    `, [classId]);

    res.json(children);
  } catch (error) {
    console.error('获取班级学生错误:', error);
    res.status(500).json({ error: '获取班级学生失败' });
  }
});

// 创建班级（仅教师可用）
router.post('/', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const { name } = req.body;
    const teacherId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: '班级名称不能为空' });
    }

    // 检查班级名称是否已存在
    const [existingClass] = await pool.execute(
      'SELECT id FROM classes WHERE name = ?',
      [name]
    );

    if (existingClass.length > 0) {
      return res.status(400).json({ error: '班级名称已存在' });
    }

    // 创建班级
    const [result] = await pool.execute(
      'INSERT INTO classes (name, teacher_id) VALUES (?, ?)',
      [name, teacherId]
    );

    res.status(201).json({
      message: '班级创建成功',
      class: {
        id: result.insertId,
        name,
        teacher_id: teacherId
      }
    });
  } catch (error) {
    console.error('创建班级错误:', error);
    res.status(500).json({ error: '创建班级失败' });
  }
});

// 添加学生到班级
router.post('/:id/children', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const classId = req.params.id;
    const { name } = req.body;
    const teacherId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: '学生姓名不能为空' });
    }

    // 权限检查：教师只能向自己的班级添加学生
    if (req.user.class_id != classId) {
      return res.status(403).json({ error: '无权向该班级添加学生' });
    }

    // 检查学生是否已存在
    const [existingChild] = await pool.execute(
      'SELECT id FROM children WHERE name = ? AND class_id = ?',
      [name, classId]
    );

    if (existingChild.length > 0) {
      return res.status(400).json({ error: '该学生已存在于班级中' });
    }

    // 添加学生
    const [result] = await pool.execute(
      'INSERT INTO children (name, class_id) VALUES (?, ?)',
      [name, classId]
    );

    res.status(201).json({
      message: '学生添加成功',
      child: {
        id: result.insertId,
        name,
        class_id: classId
      }
    });
  } catch (error) {
    console.error('添加学生错误:', error);
    res.status(500).json({ error: '添加学生失败' });
  }
});

// 删除学生
router.delete('/:id/children/:childId', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const classId = req.params.id;
    const childId = req.params.childId;

    // 权限检查：教师只能删除自己班级的学生
    if (req.user.class_id != classId) {
      return res.status(403).json({ error: '无权删除该班级学生' });
    }

    // 检查学生是否存在
    const [child] = await pool.execute(
      'SELECT id FROM children WHERE id = ? AND class_id = ?',
      [childId, classId]
    );

    if (child.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 删除学生
    await pool.execute('DELETE FROM children WHERE id = ?', [childId]);

    res.json({ message: '学生删除成功' });
  } catch (error) {
    console.error('删除学生错误:', error);
    res.status(500).json({ error: '删除学生失败' });
  }
});

module.exports = router; 