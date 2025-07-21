const mysql = require('mysql2');
require('dotenv').config();

// 阿里云数据库连接池配置
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kindergarten_system',
  
  // 连接池配置
  waitForConnections: true,
  connectionLimit: 20,           // 增加连接数
  queueLimit: 0,
  
  // 超时配置（针对阿里云数据库优化）
  acquireTimeout: 60000,         // 获取连接超时时间
  timeout: 60000,               // 查询超时时间
  connectTimeout: 60000,        // 连接超时
  reconnect: true,              // 自动重连
  
  // 时区和字符集
  timezone: '+08:00',
  charset: 'utf8mb4',
  
  // 阿里云数据库特殊配置
  enableKeepAlive: true,        // 启用keep-alive
  keepAliveInitialDelay: 0,     // keep-alive初始延迟
  multipleStatements: true,     // 允许多语句
  
  // 连接验证
  connectionLimit: 20,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
  
  // 重试配置
  maxRetries: 3,               // 最大重试次数
  retryDelay: 1000,            // 重试延迟
});

// 获取Promise包装的连接池
const promisePool = pool.promise();

// 连接池事件监听
pool.on('connection', (connection) => {
  console.log('新的数据库连接已创建');
  
  // 设置连接级别的超时
  connection.config.queryTimeout = 60000;
  connection.config.connectTimeout = 60000;
  
  // 监听连接错误
  connection.on('error', (err) => {
    console.error('数据库连接错误:', err);
  });
});

pool.on('acquire', (connection) => {
  console.log('连接已从连接池获取');
});

pool.on('release', (connection) => {
  console.log('连接已释放回连接池');
});

pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
});

// 带重试机制的数据库查询函数
const executeWithRetry = async (sql, params = [], maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [rows] = await promisePool.execute(sql, params);
      return rows;
    } catch (error) {
      console.warn(`数据库查询失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
      
      // 如果是连接相关错误，等待后重试
      if (error.code === 'ECONNRESET' || 
          error.code === 'PROTOCOL_CONNECTION_LOST' ||
          error.code === 'ETIMEDOUT' ||
          error.message.includes('Connection lost')) {
        
        if (attempt === maxRetries) {
          throw new Error(`数据库连接失败，已重试${maxRetries}次: ${error.message}`);
        }
        
        // 指数退避延迟
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        continue;
      }
      
      // 其他错误直接抛出
      throw error;
    }
  }
};

// 测试数据库连接
const testConnection = async () => {
  try {
    const rows = await executeWithRetry('SELECT 1');
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
};

// 定期健康检查
const startHealthCheck = () => {
  setInterval(async () => {
    try {
      await executeWithRetry('SELECT 1');
      console.log('数据库连接健康检查通过');
    } catch (error) {
      console.error('数据库连接健康检查失败:', error);
    }
  }, 30000); // 每30秒检查一次
};

// 连接池状态监控
const getPoolStatus = () => {
  return {
    threadId: pool.threadId,
    connectionLimit: pool.config.connectionLimit,
    // 可以添加更多状态信息
  };
};

// 导出连接池和工具函数
module.exports = {
  pool: promisePool,
  executeWithRetry,
  testConnection,
  startHealthCheck,
  getPoolStatus
};

// 应用启动时测试连接并启动健康检查
testConnection().then(() => {
  startHealthCheck();
}); 