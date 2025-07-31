const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const axios = require('axios');

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

    // 生成访问令牌和刷新令牌
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // 返回用户信息和令牌
    res.json({
      message: '登录成功',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        class_id: user.class_id,
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 新登录模块接入
router.post('/login2', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 调用外部登录系统
    const externalResponse = await axios.post('http://47.107.84.24:5001/api/zdlt/login', { 
      username, 
      password 
    });
    
    console.log('开始调用外部API...');
    
    // axios响应数据在response.data中
    const responseData = externalResponse.data;
    console.log('外部API响应数据:', responseData);
    
    // 检查外部登录是否成功，响应状态码 0成功，非0失败 msg 错误信息
    if (responseData.code !== 0) {
      return res.status(401).json({ error: responseData.msg || '登录失败' });
    }
    
    const userData = responseData.data;
    
    // 生成我们自己的JWT token
    const ourToken = generateToken({
      id: userData.userId,
      username: userData.userName,
      role: mapExternalRole(userData.rolesName)
    });
    
    res.json({
      message: '登录成功',
      accessToken: ourToken, 
      refreshToken: null, // 外部系统可能没有refresh token
      user: {
        id: userData.userId,
        username: userData.userName,
        phone: userData.phone,
        full_name: userData.name,
        school: userData.schoolName,
        class: userData.className,
        mapped_role: mapExternalRole(userData.rolesName)
      }
    });
    
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 角色映射函数
function mapExternalRole(externalRole) {
  const roleMap = {
    '老师': 'teacher',
    '家长': 'parent',
  };
  return roleMap[externalRole] || 'parent'; //其他角色暂时映射为家长角色
}

router.post('/send-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入正确的手机号码')
], async (req, res) => {
  try {
    const { phone } = req.body;
    // 转发到服务器上的5001端口
    const response = await axios.post('http://47.107.84.24:5001/api/zdlt/sendsms', { phone });
    // axios响应数据在response.data中
    const responseData = response.data;
    // 返回是否发送成功
    res.json({ success: responseData.code === 0 });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({ error: '发送验证码失败' });
  }
});

router.post('/phoneLogin', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入正确的手机号码'),
  body('smsCode').isLength({ min: 4, max: 6 }).withMessage('验证码长度为4-6位')
], async (req, res) => {
  try {
    const { phone, smsCode } = req.body;
    console.log('查看手机号登录的参数:', phone, smsCode);
    console.log('开始调用外部API...');
    
    // 调用外部手机号登录系统
    const externalResponse = await axios.post('http://47.107.84.24:5001/api/zdlt/phoneLogin', { 
      phone: phone, 
      smsCode: smsCode 
    }, {
      timeout: 10000 // 10秒超时
    });
    
    // axios响应数据在response.data中
    const responseData = externalResponse.data;
    console.log('外部API响应数据:', responseData);
    
    // 检查外部登录是否成功，响应状态码 0成功，非0失败 msg 错误信息
    if (responseData.code !== 0) {
      return res.status(401).json({ error: responseData.msg || '登录失败' });
    }
    const externalData = responseData.data;
    
    // 生成我们自己的JWT token
    const ourToken = generateToken({
      id: externalData.userId,
      username: externalData.userName,
      role: mapExternalRole(externalData.rolesName)
    });
    
    // 返回统一格式的响应
    res.json({
      message: '登录成功',
      accessToken: ourToken,
      refreshToken: null,
      user: {
        id: externalData.userId,
        username: externalData.userName,
        phone: externalData.phone,
        full_name: externalData.name,
        school: externalData.schoolName,
        class: externalData.className,
        mapped_role: mapExternalRole(externalData.rolesName)
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

// 刷新访问令牌
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('刷新令牌不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { refreshToken } = req.body;

    // 验证刷新令牌
    const decoded = verifyRefreshToken(refreshToken);

    // 从数据库获取用户信息
    const [users] = await pool.execute(
      'SELECT id, username, role, full_name, class_id FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const user = users[0];

    // 生成新的访问令牌
    const newAccessToken = generateToken(user);

    res.json({
      message: '令牌刷新成功',
      accessToken: newAccessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        class_id: user.class_id
      }
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(401).json({ error: '刷新令牌无效' });
  }
});

module.exports = router; 