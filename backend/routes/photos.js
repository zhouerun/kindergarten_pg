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

// 模拟人脸识别功能
const simulateFaceRecognition = async (classId) => {
  // 获取班级所有学生
  const [children] = await pool.execute(
    'SELECT id FROM children WHERE class_id = ?',
    [classId]
  );
  
  // 随机选择1-3个学生
  const randomCount = Math.floor(Math.random() * 3) + 1;
  const selectedChildren = children
    .sort(() => 0.5 - Math.random())
    .slice(0, randomCount)
    .map(child => child.id);
  
  return {
    child_ids: selectedChildren,
    confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0之间的置信度
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
      
      // 模拟人脸识别
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
    const offset = (page - 1) * limit;
    
    console.log('获取公共照片请求 - 参数:', { page, limit, offset });
    
    // 临时返回模拟数据用于测试
    const mockPhotos = [
      {
        id: 1,
        path: '/uploads/sample1.jpg',
        created_at: new Date().toISOString(),
        uploader_name: '张老师',
        class_name: '大班A',
        recognition_data: JSON.stringify({
          child_ids: [1, 2],
          confidence: 0.85
        }),
        like_count: 5,
        children: [
          { id: 1, name: '小明' },
          { id: 2, name: '小红' }
        ]
      },
      {
        id: 2,
        path: '/uploads/sample2.jpg',
        created_at: new Date().toISOString(),
        uploader_name: '李老师',
        class_name: '中班B',
        recognition_data: JSON.stringify({
          child_ids: [3],
          confidence: 0.92
        }),
        like_count: 3,
        children: [
          { id: 3, name: '小刚' }
        ]
      }
    ];
    
    const response = {
      photos: mockPhotos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockPhotos.length
      }
    };

    console.log('返回的响应:', response);
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
    const offset = (page - 1) * limit;
    const parentId = req.user.id;
    
    // 获取家长的孩子ID
    const [children] = await pool.execute(
      'SELECT child_id FROM parent_child WHERE parent_id = ?',
      [parentId]
    );
    
    if (children.length === 0) {
      return res.json({ photos: [], pagination: { page: 1, limit: 20, total: 0 } });
    }
    
    const childIds = children.map(child => child.child_id);
    
    const [photos] = await pool.execute(`
      SELECT DISTINCT p.id, p.path, p.created_at, u.full_name as uploader_name,
             c.name as class_name, p.recognition_data,
             COUNT(l.user_id) as like_count
      FROM photos p
      LEFT JOIN users u ON p.uploader_id = u.id
      LEFT JOIN classes c ON p.class_id = c.id
      LEFT JOIN likes l ON p.id = l.photo_id
      WHERE JSON_CONTAINS(p.recognition_data, JSON_ARRAY(${childIds.map(() => '?').join(',')}))
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...childIds, parseInt(limit), offset]);

    // 为每张照片添加识别到的孩子信息
    for (let photo of photos) {
      if (photo.recognition_data) {
        const recognitionData = JSON.parse(photo.recognition_data);
        const photoChildIds = recognitionData.child_ids || [];
        
        if (photoChildIds.length > 0) {
          const [photoChildren] = await pool.execute(
            `SELECT id, name FROM children WHERE id IN (${photoChildIds.map(() => '?').join(',')})`,
            photoChildIds
          );
          photo.children = photoChildren;
        } else {
          photo.children = [];
        }
      } else {
        photo.children = [];
      }
    }

    res.json({
      photos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: photos.length
      }
    });
  } catch (error) {
    console.error('获取私有照片错误:', error);
    res.status(500).json({ error: '获取照片失败' });
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

// 自然语言搜索照片（模拟）
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    // 简单的关键词匹配搜索
    const [photos] = await pool.execute(`
      SELECT p.id, p.path, p.created_at, u.full_name as uploader_name,
             c.name as class_name, p.recognition_data,
             COUNT(l.user_id) as like_count
      FROM photos p
      LEFT JOIN users u ON p.uploader_id = u.id
      LEFT JOIN classes c ON p.class_id = c.id
      LEFT JOIN likes l ON p.id = l.photo_id
      WHERE p.is_public = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `);
    
    // 为每张照片添加识别到的孩子信息
    for (let photo of photos) {
      if (photo.recognition_data) {
        const recognitionData = JSON.parse(photo.recognition_data);
        const childIds = recognitionData.child_ids || [];
        
        if (childIds.length > 0) {
          const [children] = await pool.execute(
            `SELECT id, name FROM children WHERE id IN (${childIds.map(() => '?').join(',')})`,
            childIds
          );
          photo.children = children;
        } else {
          photo.children = [];
        }
      } else {
        photo.children = [];
      }
    }
    
    res.json({
      photos,
      query,
      message: `搜索关键词"${query}"的结果（模拟）`
    });
  } catch (error) {
    console.error('搜索照片错误:', error);
    res.status(500).json({ error: '搜索失败' });
  }
});

module.exports = router; 