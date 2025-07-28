const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// 检查依赖是否安装
let axios;
let dependenciesInstalled = true;
try {
  axios = require('axios');
} catch (error) {
  dependenciesInstalled = false;
  console.warn('⚠️  警告: axios 依赖未安装');
  console.warn('请运行以下命令安装依赖:');
  console.warn('npm install axios');
  console.warn('在依赖安装完成前，人脸识别功能将不可用');
}

// 数据库连接
const mysql = require('mysql2/promise');
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', 
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kindergarten_system',
  charset: 'utf8mb4'
};

// 远端API配置
const REMOTE_SERVER_BASE_URL = process.env.REMOTE_SERVER_BASE_URL || 'http://192.168.5.38:5000';
const REMOTE_TRAINING_API = process.env.REMOTE_TRAINING_API || `${REMOTE_SERVER_BASE_URL}/database/add_child`;
const REMOTE_BATCH_RECOGNIZE_API = process.env.REMOTE_BATCH_RECOGNIZE_API || `${REMOTE_SERVER_BASE_URL}/batch_recognize`;
const REMOTE_HEALTH_CHECK_API = process.env.REMOTE_HEALTH_CHECK_API || `${REMOTE_SERVER_BASE_URL}/health`;
const REMOTE_API_TIMEOUT = parseInt(process.env.REMOTE_API_TIMEOUT) || 60000;
const REMOTE_API_MAX_RETRIES = parseInt(process.env.REMOTE_API_MAX_RETRIES) || 3;

// 构建发送给远端的数据 (JSON格式)
const buildRemoteTrainingData = (childInfo, files) => {
  if (!dependenciesInstalled) {
    throw new Error('依赖未安装，无法构建远端训练数据');
  }
  
  // 将文件转换为base64格式
  const images = files.map(file => {
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  });
  
  // 按照start_system.py格式构建JSON数据
  const jsonData = {
    name: childInfo.name,
    images: images,
    profile: {
      age: childInfo.age,
      student_id: childInfo.id,
      class_id:   childInfo.class_id
    }
  };
  
  return jsonData;
};

// 发送到远端训练服务 (JSON格式)
const sendToRemoteTrainingService = async (jsonData) => {
  try {
    const response = await axios.post(REMOTE_TRAINING_API, jsonData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: REMOTE_API_TIMEOUT,
      maxContentLength: 50 * 1024 * 1024, // 50MB
      maxBodyLength: 50 * 1024 * 1024,
    });
    
    return response.data;
  } catch (error) {
    console.log(jsonData);
    console.error('远端训练服务调用失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    throw new Error('训练服务暂时不可用，请稍后重试');
  }
};

// 带重试的远端服务调用
const sendWithRetry = async (jsonData, maxRetries = REMOTE_API_MAX_RETRIES) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendToRemoteTrainingService(jsonData);
    } catch (error) {
      console.log(`第${attempt}次尝试失败:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error('远端服务连接失败，请检查网络连接');
      }
      
      // 指数退避延迟
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};



// 新增：按照start_system.py格式的训练数据上传接口
router.post('/database/add_child', 
  authenticateToken, 
  authorizeRole(['parent']), 
  async (req, res) => {
    console.log('=== 按照start_system格式发送训练数据开始 ===');
    console.log('用户信息:', req.user);
    console.log('请求体键:', Object.keys(req.body));
    
    try {
      // 0. 检查依赖是否安装
      if (!dependenciesInstalled) {
        return res.status(503).json({ 
          error: '服务暂时不可用',
          message: '人脸识别训练服务需要安装额外依赖',
          instruction: '请管理员运行: npm install axios'
        });
      }
      
      const { name, images, profile } = req.body;
      const uploaderId = req.user.id;
      
      // 1. 验证基本参数
      if (!name) {
        return res.status(400).json({ error: '孩子姓名不能为空' });
      }
      
      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: '请提供要上传的孩子照片(base64格式)' });
      }
      
      if (images.length > 5) {
        return res.status(400).json({ error: '最多只能上传5张照片' });
      }
      
      if (!profile || !profile.age) {
        return res.status(400).json({ error: '请提供孩子的年龄信息' });
      }
      
      console.log(`为孩子 ${name} (年龄: ${profile.age}) 上传 ${images.length} 张训练图片`);
      
      // 2. 查找孩子信息（根据姓名）
      const connection = await mysql.createConnection(dbConfig);
      let childInfo;
      try {
        const [rows] = await connection.execute(
          'SELECT id, name, age, student_number, class_id FROM children WHERE name = ? AND age = ?',
          [name, profile.age]
        );
        
        if (rows.length === 0) {
          return res.status(404).json({ error: `未找到姓名为"${name}"且年龄为${profile.age}岁的孩子信息` });
        }
        
        childInfo = rows[0];
      } finally {
        await connection.end();
      }
      
      console.log('找到孩子信息:', { id: childInfo.id, name: childInfo.name, age: childInfo.age });
      
      // 3. 验证base64图片并转换为buffer
      const imageBuffers = [];
      for (let i = 0; i < images.length; i++) {
        try {
          let base64Data = images[i];
          // 移除data:image/类型前缀（如果存在）
          if (base64Data.startsWith('data:image/')) {
            base64Data = base64Data.split(',')[1];
          }
          
          const buffer = Buffer.from(base64Data, 'base64');
          if (buffer.length === 0) {
            throw new Error(`第${i+1}张图片base64数据无效`);
          }
          
          imageBuffers.push({
            buffer: buffer,
            originalname: `image_${i+1}.jpg`,
            mimetype: 'image/jpeg',
            size: buffer.length
          });
        } catch (error) {
          return res.status(400).json({ error: `第${i+1}张图片base64解码失败: ${error.message}` });
        }
      }
      
      console.log(`成功解码 ${imageBuffers.length} 张base64图片`);
      
      // 4. 构建发送给远端的数据
      const remoteData = buildRemoteTrainingData(childInfo, imageBuffers);
      console.log('远端API地址:', REMOTE_TRAINING_API);
      
      // 5. 发送到远端训练服务
      const remoteResult = await sendWithRetry(remoteData);
      console.log('远端API响应:', remoteResult);
      

      
      // 7. 返回处理结果
      const response = {
        message: '人脸识别训练数据已发送到训练服务',
        success: true,
        childInfo: {
          id: childInfo.id,
          name: childInfo.name,
          age: childInfo.age
        },
        results: imageBuffers.map((img, index) => ({
          filename: img.originalname,
          status: 'sent_to_remote',
          fileSize: img.size,
          imageIndex: index + 1
        })),
        summary: {
          totalUploaded: images.length,
          successCount: images.length,
          recommendation: {
            status: 'submitted',
            message: '训练数据已提交到远端服务进行处理'
          }
        },
        trainingResult: remoteResult,
        uploadedFiles: images.length
      };
      
      console.log('训练数据上传完成，返回结果');
      res.json(response);
      
    } catch (error) {
      console.error('训练数据上传错误:', error);
      res.status(500).json({ 
        error: error.message || '上传失败: ' + error.message 
      });
    }
  }
);

// 批量识别代理路由 - 解决跨域问题
router.post('/batch-recognize', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  console.log('=== 批量识别代理请求开始 ===');
  console.log('用户信息:', req.user);
  console.log('请求体键:', Object.keys(req.body));
  
  try {
    // 检查axios是否可用
    if (!dependenciesInstalled) {
      return res.status(503).json({ 
        error: '服务暂时不可用',
        message: '批量识别服务需要安装axios依赖',
        instruction: '请管理员运行: npm install axios'
      });
    }
    
    console.log('转发请求到远端服务:', REMOTE_BATCH_RECOGNIZE_API);
    console.log('请求数据大小:', JSON.stringify(req.body).length, '字符');
    
    // 转发请求到远端服务
    const response = await axios.post(REMOTE_BATCH_RECOGNIZE_API, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: REMOTE_API_TIMEOUT,
      maxContentLength: 100 * 1024 * 1024, // 100MB
      maxBodyLength: 100 * 1024 * 1024,
    });
    
    console.log('远端服务响应状态:', response.status);
    console.log('远端服务响应数据类型:', typeof response.data);
    
    // 返回远端服务的响应
    res.json(response.data);
    
  } catch (error) {
    console.error('批量识别代理错误:', error.message);
    
    if (error.response) {
      // 远端服务返回了错误响应
      console.error('远端服务错误状态:', error.response.status);
      console.error('远端服务错误数据:', error.response.data);
      res.status(error.response.status).json({
        error: '远端识别服务错误',
        details: error.response.data
      });
    } else if (error.request) {
      // 请求发送失败（网络问题等）
      console.error('网络请求失败:', error.request);
      res.status(503).json({
        error: '无法连接到远端识别服务',
        message: '请检查网络连接或稍后重试'
      });
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      res.status(500).json({
        error: '批量识别服务内部错误',
        message: error.message
      });
    }
  }
});

// 健康检查 - 检查远端服务连接
router.get('/health', async (req, res) => {
  try {
    if (!dependenciesInstalled) {
      return res.status(503).json({ 
        status: 'unhealthy', 
        dependencies: 'missing',
        message: '缺少依赖: axios',
        instruction: '请运行: npm install axios'
      });
    }
    
    const response = await axios.get(REMOTE_HEALTH_CHECK_API, {
      timeout: 5000
    });
    res.json({ 
      status: 'healthy', 
      dependencies: 'installed',
      remote_service: 'connected',
      remote_response: response.data
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      dependencies: 'installed',
      remote_service: 'disconnected',
      error: error.message 
    });
  }
});

module.exports = router; 
