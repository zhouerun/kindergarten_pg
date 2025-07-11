const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// 获取当前用户信息
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [users] = await pool.execute(
      'SELECT id, username, role, full_name, class_id, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = users[0];
    
    // 如果是家长，获取关联的孩子信息
    if (user.role === 'parent') {
      const [children] = await pool.execute(`
        SELECT c.id, c.name, cl.name as class_name
        FROM children c
        JOIN parent_child pc ON c.id = pc.child_id
        JOIN classes cl ON c.class_id = cl.id
        WHERE pc.parent_id = ?
      `, [userId]);
      
      user.children = children;
    }

    // 如果是教师，获取班级信息
    if (user.role === 'teacher' && user.class_id) {
      const [classes] = await pool.execute(
        'SELECT id, name FROM classes WHERE id = ?',
        [user.class_id]
      );
      
      if (classes.length > 0) {
        user.class = classes[0];
      }
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: '姓名不能为空' });
    }

    await pool.execute(
      'UPDATE users SET full_name = ? WHERE id = ?',
      [full_name, userId]
    );

    res.json({ message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

// 获取所有用户（仅教师可用）
router.get('/', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = `
      SELECT u.id, u.username, u.role, u.full_name, u.class_id, u.created_at,
             c.name as class_name
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    
    query += ' ORDER BY u.created_at DESC';
    
    const [users] = await pool.execute(query, params);

    // 为家长用户获取孩子信息
    for (let user of users) {
      if (user.role === 'parent') {
        const [children] = await pool.execute(`
          SELECT c.id, c.name, cl.name as class_name
          FROM children c
          JOIN parent_child pc ON c.id = pc.child_id
          JOIN classes cl ON c.class_id = cl.id
          WHERE pc.parent_id = ?
        `, [user.id]);
        
        user.children = children;
      }
    }

    res.json(users);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 获取所有家长用户（仅教师可用）
router.get('/parents', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const [parents] = await pool.execute(`
      SELECT u.id, u.username, u.full_name, u.class_id, u.created_at,
             c.name as class_name
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      WHERE u.role = 'parent'
      ORDER BY u.full_name
    `);

    // 为每个家长获取孩子信息
    for (let parent of parents) {
      const [children] = await pool.execute(`
        SELECT c.id, c.name, cl.name as class_name
        FROM children c
        JOIN parent_child pc ON c.id = pc.child_id
        JOIN classes cl ON c.class_id = cl.id
        WHERE pc.parent_id = ?
      `, [parent.id]);
      
      parent.children = children;
    }

    res.json(parents);
  } catch (error) {
    console.error('获取家长列表错误:', error);
    res.status(500).json({ error: '获取家长列表失败' });
  }
});

// 获取当前用户关联的孩子（家长专用）
router.get('/children', authenticateToken, authorizeRole(['parent']), async (req, res) => {
  try {
    const parentId = req.user.id;
    
    const [children] = await pool.execute(`
      SELECT c.id, c.name, c.class_id, c.created_at,
             cl.name as class_name
      FROM children c
      JOIN parent_child pc ON c.id = pc.child_id
      JOIN classes cl ON c.class_id = cl.id
      WHERE pc.parent_id = ?
      ORDER BY c.name
    `, [parentId]);

    res.json(children);
  } catch (error) {
    console.error('获取孩子列表错误:', error);
    res.status(500).json({ error: '获取孩子列表失败' });
  }
});

// 家长绑定孩子（家长专用）
router.post('/bind-child', authenticateToken, authorizeRole(['parent']), async (req, res) => {
  try {
    console.log('=== 家长绑定孩子请求开始 ===');
    console.log('用户信息:', req.user);
    console.log('请求体:', req.body);
    
    const parentId = req.user.id;
    const { studentNumber } = req.body;

    if (!studentNumber) {
      return res.status(400).json({ error: '学号不能为空' });
    }

    // 检查孩子是否存在（通过学号查找）
    const [child] = await pool.execute(
      'SELECT id, name, student_number FROM children WHERE student_number = ?',
      [studentNumber]
    );

    if (child.length === 0) {
      return res.status(404).json({ error: '学号有误，请检查学号是否正确' });
    }

    const childId = child[0].id;

    // 检查是否已经绑定
    const [existing] = await pool.execute(
      'SELECT * FROM parent_child WHERE parent_id = ? AND child_id = ?',
      [parentId, childId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: '您已经绑定了这个孩子' });
    }

    // 创建绑定关系
    await pool.execute(
      'INSERT INTO parent_child (parent_id, child_id) VALUES (?, ?)',
      [parentId, childId]
    );

    console.log(`家长 ${parentId} 成功绑定孩子 ${childId} (学号: ${studentNumber})`);
    res.json({ 
      message: '绑定成功',
      child: child[0]
    });
  } catch (error) {
    console.error('家长绑定孩子错误:', error);
    res.status(500).json({ error: '绑定失败: ' + error.message });
  }
});

// 家长解绑孩子（家长专用）
router.delete('/bind-child', authenticateToken, authorizeRole(['parent']), async (req, res) => {
  try {
    console.log('=== 家长解绑孩子请求开始 ===');
    console.log('用户信息:', req.user);
    console.log('请求体:', req.body);
    
    const parentId = req.user.id;
    const { childId } = req.body;

    if (!childId) {
      return res.status(400).json({ error: '学生ID不能为空' });
    }

    // 检查绑定关系是否存在
    const [existing] = await pool.execute(
      'SELECT * FROM parent_child WHERE parent_id = ? AND child_id = ?',
      [parentId, childId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: '绑定关系不存在' });
    }

    // 删除绑定关系
    await pool.execute(
      'DELETE FROM parent_child WHERE parent_id = ? AND child_id = ?',
      [parentId, childId]
    );

    console.log(`家长 ${parentId} 成功解绑孩子 ${childId}`);
    res.json({ message: '解绑成功' });
  } catch (error) {
    console.error('家长解绑孩子错误:', error);
    res.status(500).json({ error: '解绑失败: ' + error.message });
  }
});

module.exports = router; 