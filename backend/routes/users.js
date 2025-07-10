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

// 关联家长和孩子
router.post('/parent-child', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    console.log('=== 关联家长和孩子请求开始 ===');
    console.log('用户信息:', req.user);
    console.log('请求体:', req.body);
    
    const { parentId, childId } = req.body;

    if (!parentId || !childId) {
      return res.status(400).json({ error: '家长ID和孩子ID不能为空' });
    }

    // 检查家长是否存在
    const [parent] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND role = "parent"',
      [parentId]
    );

    if (parent.length === 0) {
      return res.status(404).json({ error: '家长不存在' });
    }

    // 检查孩子是否存在
    const [child] = await pool.execute(
      'SELECT id FROM children WHERE id = ?',
      [childId]
    );

    if (child.length === 0) {
      return res.status(404).json({ error: '孩子不存在' });
    }

    // 检查是否已经关联
    const [existing] = await pool.execute(
      'SELECT * FROM parent_child WHERE parent_id = ? AND child_id = ?',
      [parentId, childId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: '家长和孩子已经关联' });
    }

    // 创建关联
    await pool.execute(
      'INSERT INTO parent_child (parent_id, child_id) VALUES (?, ?)',
      [parentId, childId]
    );

    res.json({ message: '家长和孩子关联成功' });
  } catch (error) {
    console.error('关联家长和孩子错误:', error);
    res.status(500).json({ error: '关联失败' });
  }
});

// 取消家长和孩子的关联
router.delete('/parent-child', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const { parentId, childId } = req.body;

    if (!parentId || !childId) {
      return res.status(400).json({ error: '家长ID和孩子ID不能为空' });
    }

    // 检查关联是否存在
    const [existing] = await pool.execute(
      'SELECT * FROM parent_child WHERE parent_id = ? AND child_id = ?',
      [parentId, childId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: '关联不存在' });
    }

    // 删除关联
    await pool.execute(
      'DELETE FROM parent_child WHERE parent_id = ? AND child_id = ?',
      [parentId, childId]
    );

    res.json({ message: '取消关联成功' });
  } catch (error) {
    console.error('取消关联错误:', error);
    res.status(500).json({ error: '取消关联失败' });
  }
});

// 批量更新家长和孩子的关联关系
router.put('/:id/children', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    console.log('=== 批量更新家长和孩子关联关系请求开始 ===');
    console.log('用户信息:', req.user);
    console.log('家长ID:', req.params.id);
    console.log('请求体:', req.body);
    
    const parentId = req.params.id;
    const { children } = req.body;

    if (!parentId) {
      return res.status(400).json({ error: '家长ID不能为空' });
    }

    if (!Array.isArray(children)) {
      return res.status(400).json({ error: '孩子列表必须是数组' });
    }

    // 检查家长是否存在
    const [parent] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND role = "parent"',
      [parentId]
    );

    if (parent.length === 0) {
      return res.status(404).json({ error: '家长不存在' });
    }

    // 检查所有孩子是否存在
    if (children.length > 0) {
      const placeholders = children.map(() => '?').join(',');
      const [existingChildren] = await pool.execute(
        `SELECT id FROM children WHERE id IN (${placeholders})`,
        children
      );

      if (existingChildren.length !== children.length) {
        return res.status(400).json({ error: '部分孩子不存在' });
      }
    }

    // 获取连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 删除该家长的所有现有关联
      await connection.execute(
        'DELETE FROM parent_child WHERE parent_id = ?',
        [parentId]
      );

      // 添加新的关联
      if (children.length > 0) {
        const values = children.map(childId => [parentId, childId]);
        const placeholders = values.map(() => '(?, ?)').join(',');
        const flatValues = values.flat();
        
        await connection.execute(
          `INSERT INTO parent_child (parent_id, child_id) VALUES ${placeholders}`,
          flatValues
        );
      }

      // 提交事务
      await connection.commit();

      console.log('家长和孩子关联关系更新成功');
      res.json({ message: '关联关系更新成功' });
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  } catch (error) {
    console.error('批量更新家长和孩子关联关系错误:', error);
    res.status(500).json({ error: '更新关联关系失败: ' + error.message });
  }
});

module.exports = router; 