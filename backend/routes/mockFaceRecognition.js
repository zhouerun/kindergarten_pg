const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// 检查依赖是否安装
let axios, FormData;
let dependenciesInstalled = true;
try {
  axios = require('axios');
  FormData = require('form-data');
} catch (error) {
  dependenciesInstalled = false;
  console.warn('⚠️  警告: axios 或 form-data 依赖未安装');
  console.warn('请运行以下命令安装依赖:');
  console.warn('npm install axios form-data');
  console.warn('在依赖安装完成前，人脸识别训练功能将不可用');
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

// 远端训练API配置
const REMOTE_TRAINING_API = process.env.REMOTE_TRAINING_API || 'http://192.168.5.61:5000/database/add_child';
const REMOTE_API_TIMEOUT = parseInt(process.env.REMOTE_API_TIMEOUT) || 60000;
const REMOTE_API_MAX_RETRIES = parseInt(process.env.REMOTE_API_MAX_RETRIES) || 3;

// 配置内存存储（不保存到硬盘）
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('人脸识别训练只支持 JPG、PNG 格式的图片'), false);
    }
  }
});

// 获取孩子完整信息
const getChildInfo = async (childId) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(
      'SELECT id, name, age, student_number, class_id FROM children WHERE id = ?',
      [childId]
    );
    
    if (rows.length === 0) {
      throw new Error('未找到指定的孩子信息');
    }
    
    return rows[0];
  } finally {
    await connection.end();
  }
};

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

// 内存中存储训练状态（用于状态查询）
const trainingStatusData = new Map(); // childId -> status

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
          instruction: '请管理员运行: npm install axios form-data'
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
      
      // 6. 更新本地训练状态
      trainingStatusData.set(childInfo.id.toString(), {
        childId: childInfo.id,
        childInfo: {
          id: childInfo.id,
          name: childInfo.name,
          age: childInfo.age,
          class_id: childInfo.class_id
        },
        totalImages: images.length,
        uploadTime: new Date().toISOString(),
        remoteTrainingId: remoteResult.trainingId || null,
        status: 'submitted',
        lastUpdate: new Date().toISOString()
      });
      
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

// 上传人脸识别训练数据到远端服务（原有接口保留）
router.post('/upload-training-data', 
  authenticateToken, 
  authorizeRole(['parent']), 
  upload.array('faceImages', 5), 
  async (req, res) => {
    console.log('=== 向远端发送训练数据开始 ===');
    console.log('用户信息:', req.user);
    console.log('请求体:', req.body);
    console.log('文件数量:', req.files ? req.files.length : 0);
    
    try {
      // 0. 检查依赖是否安装
      if (!dependenciesInstalled) {
        return res.status(503).json({ 
          error: '服务暂时不可用',
          message: '人脸识别训练服务需要安装额外依赖',
          instruction: '请管理员运行: npm install axios form-data'
        });
      }
      
      const { childId } = req.body;
      const uploaderId = req.user.id;
      
      // 1. 验证基本参数
      if (!childId) {
        return res.status(400).json({ error: '孩子ID不能为空' });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '请选择要上传的孩子照片' });
      }
      
      if (req.files.length > 5) {
        return res.status(400).json({ error: '最多只能上传5张照片' });
      }
      
      console.log(`为孩子 ID: ${childId} 上传 ${req.files.length} 张训练图片`);
      
      // 2. 获取孩子完整信息（包含age）
      const childInfo = await getChildInfo(childId);
      console.log('孩子信息:', { id: childInfo.id, name: childInfo.name, age: childInfo.age });
      
      // 验证孩子年龄数据
      if (!childInfo.age || childInfo.age < 1 || childInfo.age > 10) {
        return res.status(400).json({ error: '孩子年龄数据异常' });
      }
      
      // 3. 构建发送给远端的数据
      const remoteData = buildRemoteTrainingData(childInfo, req.files);
      console.log('远端API地址:', REMOTE_TRAINING_API);
      
      // 4. 发送到远端训练服务
      const remoteResult = await sendWithRetry(remoteData);
      console.log('远端API响应:', remoteResult);
      
      // 5. 更新本地训练状态
      trainingStatusData.set(childId, {
        childId: parseInt(childId),
        childInfo: {
          id: childInfo.id,
          name: childInfo.name,
          age: childInfo.age,
          class_id: childInfo.class_id
        },
        totalImages: req.files.length,
        uploadTime: new Date().toISOString(),
        remoteTrainingId: remoteResult.trainingId || null,
        status: 'submitted',
        lastUpdate: new Date().toISOString()
      });
      
      // 6. 返回处理结果
      const response = {
        message: '人脸识别训练数据已发送到训练服务',
        childInfo: {
          id: childInfo.id,
          name: childInfo.name,
          age: childInfo.age
        },
        results: req.files.map(file => ({
          filename: file.originalname,
          status: 'sent_to_remote',
          fileSize: file.size
        })),
        summary: {
          totalUploaded: req.files.length,
          successCount: req.files.length,
          recommendation: {
            status: 'submitted',
            message: '训练数据已提交到远端服务进行处理'
          }
        },
        trainingResult: remoteResult,
        uploadedFiles: req.files.length
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

// 获取孩子的人脸训练数据状态
router.get('/training-status/:childId', 
  authenticateToken, 
  authorizeRole(['parent']), 
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      console.log(`获取孩子 ${childId} 的训练状态`);
      
      // 从内存中获取训练状态
      const statusData = trainingStatusData.get(childId);
      
      if (!statusData) {
        // 如果没有训练数据，获取孩子基本信息
        try {
          const childInfo = await getChildInfo(childId);
          const trainingStatus = {
            childId: parseInt(childId),
            childInfo: {
              id: childInfo.id,
              name: childInfo.name,
              age: childInfo.age,
              class_id: childInfo.class_id
            },
            totalImages: 0,
            approvedImages: 0,
            averageQuality: 0,
            goodQualityImages: 0,
            trainingCompleted: false,
            images: [],
            requirements: {
              minImages: 1,
              maxImages: 5,
              currentStatus: 'not_started'
            },
            status: 'not_started',
            note: '尚未上传训练数据'
          };
          
          return res.json(trainingStatus);
        } catch (error) {
          return res.status(404).json({ error: '未找到孩子信息' });
        }
      }
      
      const trainingStatus = {
        childId: statusData.childId,
        childInfo: statusData.childInfo,
        totalImages: statusData.totalImages,
        approvedImages: statusData.totalImages, // 假设远端都会处理
        averageQuality: 0.85, // 模拟平均质量
        goodQualityImages: statusData.totalImages,
        trainingCompleted: statusData.status === 'completed',
        images: [], // 远端处理，不返回具体图片信息
        requirements: {
          minImages: 1,
          maxImages: 5,
          currentStatus: statusData.status
        },
        remoteTrainingId: statusData.remoteTrainingId,
        status: statusData.status,
        uploadTime: statusData.uploadTime,
        lastUpdate: statusData.lastUpdate,
        note: '训练数据已提交到远端服务'
      };
      
      res.json(trainingStatus);
      
    } catch (error) {
      console.error('获取训练状态错误:', error);
      res.status(500).json({ error: '获取训练状态失败' });
    }
  }
);

// 删除训练数据（远端服务暂不支持，仅清除本地状态）
router.delete('/training-data/:imageId', 
  authenticateToken, 
  authorizeRole(['parent']), 
  async (req, res) => {
    try {
      const { imageId } = req.params;
      
      console.log(`删除训练数据 ${imageId}（仅清除本地状态）`);
      
      // 由于是远端处理，这里只是模拟删除操作
      res.json({ 
        message: '远端训练数据无法单独删除，请重新上传完整训练数据',
        note: '远端服务不支持单张图片删除操作'
      });
      
    } catch (error) {
      console.error('删除训练数据错误:', error);
      res.status(500).json({ error: '删除失败' });
    }
  }
);

// 清空所有训练状态数据（开发测试用）
router.post('/clear-training-data', 
  authenticateToken, 
  authorizeRole(['parent']), 
  async (req, res) => {
    try {
      trainingStatusData.clear();
      res.json({ 
        message: '所有训练状态数据已清空',
        note: '这仅清空本地状态数据，不影响远端训练服务'
      });
    } catch (error) {
      res.status(500).json({ error: '清空数据失败' });
    }
  }
);

// 健康检查 - 检查远端服务连接
router.get('/health', async (req, res) => {
  try {
    if (!dependenciesInstalled) {
      return res.status(503).json({ 
        status: 'unhealthy', 
        dependencies: 'missing',
        message: '缺少依赖: axios, form-data',
        instruction: '请运行: npm install axios form-data'
      });
    }
    
    const response = await axios.get(REMOTE_TRAINING_API.replace('/database/add_child', '/health'), {
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
