const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// 用户登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    // 查找用户
    const [users] = await pool.execute(
      'SELECT id, username, password, role, full_name, class_id FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = users[0];

    // 验证密码 - 使用bcrypt哈希验证
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成token
    const token = generateToken(user);

    // 返回用户信息和token
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        class_id: user.class_id
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 用户注册
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3位'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').isIn(['teacher', 'parent']).withMessage('角色必须是teacher或parent'),
  body('full_name').notEmpty().withMessage('姓名不能为空'),
  body('telephone_number').isMobilePhone('zh-CN').withMessage('请输入正确的手机号码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password, role, full_name, telephone_number, class_id } = req.body;

    // 检查用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 检查电话号码是否已存在
    const [existingPhones] = await pool.execute(
      'SELECT id FROM users WHERE telephone_number = ?',
      [telephone_number]
    );

    if (existingPhones.length > 0) {
      return res.status(400).json({ error: '电话号码已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role, full_name, telephone_number, class_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, role, full_name, telephone_number, class_id || null]
    );

    res.status(201).json({
      message: '注册成功',
      user: {
        id: result.insertId,
        username,
        role,
        full_name,
        telephone_number,
        class_id
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 修改密码
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('当前密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 获取当前密码
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: '当前密码错误' });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
});

module.exports = router; 