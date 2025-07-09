const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'kindergarten_secret_key_change_in_production';

// 验证JWT token
const authenticateToken = async (req, res, next) => {
  console.log('=== 认证中间件开始 ===');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Authorization header:', authHeader);
  console.log('提取的token:', token ? token.substring(0, 20) + '...' : 'null');

  if (!token) {
    console.log('认证失败：令牌缺失');
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token解码成功:', decoded);
    
    // 从数据库获取用户信息
    const [users] = await pool.execute(
      'SELECT id, username, role, full_name, class_id FROM users WHERE id = ?',
      [decoded.userId]
    );

    console.log('数据库查询结果:', users);

    if (users.length === 0) {
      console.log('认证失败：用户不存在');
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = users[0];
    console.log('认证成功，用户信息:', req.user);
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(403).json({ error: '访问令牌无效' });
  }
};

// 验证用户角色
const authorizeRole = (roles) => {
  return (req, res, next) => {
    console.log('=== 角色验证中间件开始 ===');
    console.log('需要的角色:', roles);
    console.log('用户角色:', req.user?.role);
    
    if (!req.user) {
      console.log('角色验证失败：未认证的用户');
      return res.status(401).json({ error: '未认证的用户' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('角色验证失败：权限不足');
      return res.status(403).json({ error: '权限不足' });
    }

    console.log('角色验证成功');
    next();
  };
};

// 生成JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = {
  authenticateToken,
  authorizeRole,
  generateToken
}; 