const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 JPEG、PNG、GIF 格式的图片'), false);
    }
  }
});

// 【临时功能】模拟人脸识别功能
// TODO: 待集成真正的人脸识别API（如：百度AI、阿里云、腾讯云等）
// 当前为开发阶段的模拟实现，用于测试照片上传和识别流程
// 真实的人脸识别API应该：
// 1. 接收照片文件作为输入
// 2. 返回识别到的人脸特征和匹配的学生信息
// 3. 提供置信度分数
// 4. 处理无法识别的情况
const simulateFaceRecognition = async (classId) => {
  console.log('⚠️  使用模拟人脸识别功能 - 仅用于开发测试');
  
  // 获取班级所有学生（真实API中应该是从人脸库中匹配）
  const [children] = await pool.execute(
    'SELECT id FROM children WHERE class_id = ?',
    [classId]
  );
  
  if (children.length === 0) {
    console.log('班级中没有学生，返回空识别结果');
    return {
      child_ids: [],
      confidence: 0
    };
  }
  
  // 随机选择1-3个学生（模拟识别到的孩子）
  // 真实API中这里应该是实际的人脸识别结果
  const randomCount = Math.floor(Math.random() * 3) + 1;
  const selectedChildren = children
    .sort(() => 0.5 - Math.random())
    .slice(0, randomCount)
    .map(child => child.id);
  
  console.log(`模拟识别到 ${selectedChildren.length} 个孩子:`, selectedChildren);
  
  return {
    child_ids: selectedChildren,
    confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0之间的置信度（模拟）
  };
};

// 上传照片（教师专用）
router.post('/', authenticateToken, authorizeRole(['teacher']), upload.array('images', 10), async (req, res) => {
  console.log('=== 照片上传请求开始 ===');
  console.log('用户信息:', req.user);
  console.log('请求体:', req.body);
  console.log('文件信息:', req.files);
  
  try {
    const { classId, isPublic = true } = req.body;
    const uploaderId = req.user.id;
    
    console.log('解析参数:', { classId, isPublic, uploaderId });
    
    if (!req.files || req.files.length === 0) {
      console.log('错误：没有文件');
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    console.log('准备上传', req.files.length, '个文件');
    const uploadedPhotos = [];
    
    for (const file of req.files) {
      console.log('处理文件:', file.filename);
      
      // 【临时】模拟人脸识别 - 等待集成真实的人脸识别API
      // TODO: 替换为真实的人脸识别API调用
      // 真实实现应该：await realFaceRecognitionAPI(file.path, classId)
      console.log('开始人脸识别模拟，classId:', classId);
      const recognitionData = await simulateFaceRecognition(classId);
      console.log('人脸识别结果:', recognitionData);
      
      // 保存照片记录到数据库
      console.log('准备插入数据库');
      const [result] = await pool.execute(
        'INSERT INTO photos (path, uploader_id, class_id, is_public, recognition_data) VALUES (?, ?, ?, ?, ?)',
        [
          `/uploads/${file.filename}`,
          uploaderId,
          classId,
          isPublic,
          JSON.stringify(recognitionData)
        ]
      );
      
      console.log('数据库插入成功，ID:', result.insertId);
      
      uploadedPhotos.push({
        id: result.insertId,
        path: `/uploads/${file.filename}`,
        recognition_data: recognitionData
      });
    }

    console.log('所有文件处理完成');
    res.json({
      message: '照片上传成功',
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('照片上传错误详情:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: '照片上传失败: ' + error.message });
  }
});

// 获取公共照片墙
router.get('/public', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    console.log('获取公共照片请求 - 参数:', { page, limit, pageNum, limitNum, offset });
    
    // 确保参数是有效的正整数
    if (Number.isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({ error: 'Invalid limit parameter' });
    }
    if (Number.isNaN(offset) || offset < 0) {
      return res.status(400).json({ error: 'Invalid offset parameter' });
    }
    
    // 从数据库获取公共照片
    const [photos] = await pool.execute(`
      SELECT p.id, p.path, p.created_at, u.full_name as uploader_name,
             c.name as class_name, p.recognition_data,
             (SELECT COUNT(*) FROM likes l WHERE l.photo_id = p.id) as like_count
      FROM photos p
      LEFT JOIN users u ON p.uploader_id = u.id
      LEFT JOIN classes c ON p.class_id = c.id
      WHERE p.is_public = true
      ORDER BY p.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `);
    
    console.log('从数据库获取的公共照片数量:', photos.length);
    
    // 为每张照片添加识别到的孩子信息（从数据库获取）
    for (let photo of photos) {
      if (photo.recognition_data) {
        try {
          // 检查recognition_data是否已经是对象还是需要解析的字符串
          let recognitionData;
          if (typeof photo.recognition_data === 'string') {
            recognitionData = JSON.parse(photo.recognition_data);
          } else if (typeof photo.recognition_data === 'object') {
            recognitionData = photo.recognition_data;
          } else {
            photo.children = [];
            continue;
          }
          
          const childIds = recognitionData.child_ids || [];
          
          if (childIds.length > 0) {
            // 使用字符串插值避免prepared statement问题
            const placeholders = childIds.map(id => `${parseInt(id)}`).join(',');
            const [children] = await pool.execute(
              `SELECT id, name FROM children WHERE id IN (${placeholders})`
            );
            photo.children = children;
          } else {
            photo.children = [];
          }
        } catch (parseError) {
          console.error('解析公共照片识别数据错误:', parseError);
          photo.children = [];
        }
      } else {
        photo.children = [];
      }
    }
    
    // 获取公共照片总数
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM photos WHERE is_public = true'
    );
    const total = totalResult[0].total;
    
    const response = {
      photos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total
      }
    };

    console.log('返回的响应 - 照片数量:', response.photos.length, '总数:', total);
    res.json(response);
  } catch (error) {
    console.error('获取公共照片错误:', error);
    res.status(500).json({ error: '获取照片失败: ' + error.message });
  }
});

// 获取孩子的私有照片（家长专用）
router.get('/private', authenticateToken, authorizeRole(['parent']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const parentId = req.user.id;
    
    console.log('请求参数:', { page, limit, pageNum, limitNum, offset, parentId });
    console.log('参数类型:', { 
      limitNumType: typeof limitNum, 
      offsetType: typeof offset,
      limitNumIsNaN: Number.isNaN(limitNum),
      offsetIsNaN: Number.isNaN(offset)
    });
    
    // 确保参数是有效的正整数
    if (Number.isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({ error: 'Invalid limit parameter' });
    }
    if (Number.isNaN(offset) || offset < 0) {
      return res.status(400).json({ error: 'Invalid offset parameter' });
    }
    
    // 获取家长的孩子ID
    const [children] = await pool.execute(
      'SELECT child_id FROM parent_child WHERE parent_id = ?',
      [parentId]
    );
    
    if (children.length === 0) {
      return res.json({ photos: [], pagination: { page: pageNum, limit: limitNum, total: 0 } });
    }
    console.log('children', children);
    const childIds = children.map(child => child.child_id);
    
    console.log('SQL参数:', [limitNum, offset]);
    
    // 从数据库获取照片数据
    // 使用简化的SQL查询避免复杂的聚合
    let photos;
    try {
      const [result] = await pool.execute(`
        SELECT p.id, p.path, p.created_at, u.full_name as uploader_name,
               c.name as class_name, p.recognition_data,
               (SELECT COUNT(*) FROM likes l WHERE l.photo_id = p.id) as like_count
        FROM photos p
        LEFT JOIN users u ON p.uploader_id = u.id
        LEFT JOIN classes c ON p.class_id = c.id
        WHERE p.recognition_data IS NOT NULL
        ORDER BY p.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `);
      
      photos = result;
      console.log('从数据库获取到的照片:', photos.length, '张');
      
      // 如果数据库中没有照片，直接返回空结果
      if (photos.length === 0) {
        console.log('数据库中没有照片，返回空结果');
        return res.json({ 
          photos: [], 
          pagination: { 
            page: pageNum, 
            limit: limitNum, 
            total: 0 
          } 
        });
      }
      
    } catch (sqlError) {
      console.error('数据库查询错误:', sqlError);
      throw new Error('数据库查询照片失败: ' + sqlError.message);
    }
    
    // 在代码中过滤包含家长孩子的照片
    const filteredPhotos = photos.filter(photo => {
      if (!photo.recognition_data) return false;
      
      try {
        // 检查recognition_data是否已经是对象还是需要解析的字符串
        let recognitionData;
        if (typeof photo.recognition_data === 'string') {
          recognitionData = JSON.parse(photo.recognition_data);
        } else if (typeof photo.recognition_data === 'object') {
          recognitionData = photo.recognition_data;
        } else {
          console.log('未知的recognition_data类型:', typeof photo.recognition_data, photo.recognition_data);
          return false;
        }
        
        const photoChildIds = recognitionData.child_ids || [];
        console.log(`照片${photo.id}的孩子IDs:`, photoChildIds, '家长的孩子IDs:', childIds);
        
        // 检查是否有任何一个孩子ID匹配
        return photoChildIds.some(childId => childIds.includes(childId));
      } catch (error) {
        console.error('解析识别数据错误:', error);
        console.error('数据内容:', photo.recognition_data);
        console.error('数据类型:', typeof photo.recognition_data);
        return false;
      }
    });

    // 为每张照片添加识别到的孩子信息（从数据库获取）
    for (let photo of filteredPhotos) {
      if (photo.recognition_data) {
        try {
          // 检查recognition_data是否已经是对象还是需要解析的字符串
          let recognitionData;
          if (typeof photo.recognition_data === 'string') {
            recognitionData = JSON.parse(photo.recognition_data);
          } else if (typeof photo.recognition_data === 'object') {
            recognitionData = photo.recognition_data;
          } else {
            photo.children = [];
            continue;
          }
          
          const photoChildIds = recognitionData.child_ids || [];
          
          if (photoChildIds.length > 0) {
            // 使用字符串插值避免prepared statement问题
            const placeholders = photoChildIds.map(id => `${parseInt(id)}`).join(',');
            const [photoChildren] = await pool.execute(
              `SELECT id, name FROM children WHERE id IN (${placeholders})`
            );
            photo.children = photoChildren;
            console.log(`照片${photo.id}包含孩子:`, photoChildren.map(c => c.name));
          } else {
            photo.children = [];
          }
        } catch (parseError) {
          console.error('解析照片识别数据错误:', parseError);
          photo.children = [];
        }
      } else {
        photo.children = [];
      }
    }

    res.json({
      photos: filteredPhotos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredPhotos.length
      }
    });
  } catch (error) {
    console.error('获取私有照片错误:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: '获取照片失败: ' + error.message });
  }
});

// 照片点赞
router.post('/like', authenticateToken, async (req, res) => {
  try {
    const { photoId } = req.body;
    const userId = req.user.id;
    
    // 检查是否已经点赞
    const [existingLike] = await pool.execute(
      'SELECT * FROM likes WHERE user_id = ? AND photo_id = ?',
      [userId, photoId]
    );
    
    if (existingLike.length > 0) {
      // 取消点赞
      await pool.execute(
        'DELETE FROM likes WHERE user_id = ? AND photo_id = ?',
        [userId, photoId]
      );
      
      res.json({ message: '取消点赞成功', liked: false });
    } else {
      // 添加点赞
      await pool.execute(
        'INSERT INTO likes (user_id, photo_id) VALUES (?, ?)',
        [userId, photoId]
      );
      
      res.json({ message: '点赞成功', liked: true });
    }
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ error: '点赞失败' });
  }
});

// 照片搜索功能
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    // 从数据库搜索照片（基于关键词匹配）
    const [photos] = await pool.execute(`
      SELECT p.id, p.path, p.created_at, u.full_name as uploader_name,
             c.name as class_name, p.recognition_data,
             (SELECT COUNT(*) FROM likes l WHERE l.photo_id = p.id) as like_count
      FROM photos p
      LEFT JOIN users u ON p.uploader_id = u.id
      LEFT JOIN classes c ON p.class_id = c.id
      WHERE p.is_public = true
      ORDER BY p.created_at DESC
      LIMIT 20
    `);
    
    console.log('搜索到的照片数量:', photos.length);
    
    // 为每张照片添加识别到的孩子信息（从数据库获取）
    for (let photo of photos) {
      if (photo.recognition_data) {
        try {
          // 检查recognition_data是否已经是对象还是需要解析的字符串
          let recognitionData;
          if (typeof photo.recognition_data === 'string') {
            recognitionData = JSON.parse(photo.recognition_data);
          } else if (typeof photo.recognition_data === 'object') {
            recognitionData = photo.recognition_data;
          } else {
            photo.children = [];
            continue;
          }
          
          const childIds = recognitionData.child_ids || [];
          
          if (childIds.length > 0) {
            // 使用字符串插值避免prepared statement问题
            const placeholders = childIds.map(id => `${parseInt(id)}`).join(',');
            const [children] = await pool.execute(
              `SELECT id, name FROM children WHERE id IN (${placeholders})`
            );
            photo.children = children;
          } else {
            photo.children = [];
          }
        } catch (parseError) {
          console.error('解析搜索照片识别数据错误:', parseError);
          photo.children = [];
        }
      } else {
        photo.children = [];
      }
    }
    
    res.json({
      photos,
      query,
      message: `搜索关键词"${query}"的结果，共找到${photos.length}张照片`
    });
  } catch (error) {
    console.error('搜索照片错误:', error);
    res.status(500).json({ error: '搜索失败: ' + error.message });
  }
});

module.exports = router; 