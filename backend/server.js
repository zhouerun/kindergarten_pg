const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const photoRoutes = require('./routes/photos');
const classRoutes = require('./routes/classes');
const userRoutes = require('./routes/users');
const FaceRecognitionRoutes = require('./routes/faceRecognition');

const app = express();
const PORT = process.env.PORT || 3000;

// 定义允许的源
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

// 添加环境变量配置的源
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// 检查是否为本地网络IP的函数
function isLocalNetwork(origin) {
  if (!origin) return false;
  
  // 检查是否为本地网络IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const localNetworkPatterns = [
    /^http:\/\/192\.168\.\d+\.\d+:8080$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:8080$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:8080$/
  ];
  
  return localNetworkPatterns.some(pattern => pattern.test(origin));
}

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // 允许没有origin的请求（比如同源请求）
    if (!origin) return callback(null, true);
    
    // 检查是否在允许列表中
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // 检查是否为本地网络
    if (isLocalNetwork(origin)) {
      console.log('允许本地网络访问:', origin);
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP每15分钟最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 添加CORS支持
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 为静态文件添加CORS头
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || isLocalNetwork(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(uploadsDir));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/users', userRoutes);
app.use('/api/face-recognition', FaceRecognitionRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '请求的资源不存在' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`允许的CORS源: ${allowedOrigins.length} 个 + 本地网络`);
});

module.exports = app; 