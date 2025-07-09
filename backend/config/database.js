const mysql = require('mysql2');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kindergarten_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00',
  charset: 'utf8mb4'
});

// 获取Promise包装的连接池
const promisePool = pool.promise();

// 测试数据库连接
const testConnection = async () => {
  try {
    const [rows] = await promisePool.execute('SELECT 1');
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
};

// 导出连接池和测试函数
module.exports = {
  pool: promisePool,
  testConnection
};

// 应用启动时测试连接
testConnection(); 