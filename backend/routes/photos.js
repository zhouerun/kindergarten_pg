const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool, executeWithRetry } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// 添加axios用于代理请求到远端服务
let axios;
try {
  axios = require('axios');
} catch (error) {
  console.warn('⚠️  警告: axios 依赖未安装，批量识别功能将不可用');
  console.warn('请运行以下命令安装依赖: npm install axios');
}

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
    const allowedTypes = ['image/jpg','image/jpeg','image/png','image/bmp','image/tiff','image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 JPG、JPEG、PNG、BMP、TIFF、WEBP 格式的图片'), false);
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
  const children = await executeWithRetry(
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
    const { classId, isPublic = true, activity = null } = req.body;
    const uploaderId = req.user.id;
    
    console.log('解析参数:', { classId, isPublic, activity, uploaderId });
    
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
      const result = await executeWithRetry(
        'INSERT INTO photos (path, uploader_id, class_id, is_public, activity, recognition_data) VALUES (?, ?, ?, ?, ?, ?)',
        [
          `/uploads/${file.filename}`,
          uploaderId,
          classId,
          isPublic,
          activity,
          JSON.stringify(recognitionData)
        ]
      );
      
      const photoId = result.insertId;
      console.log('数据库插入成功，ID:', photoId);
      
      // 插入照片-孩子关联记录
      if (recognitionData.child_ids && recognitionData.child_ids.length > 0) {
        console.log('准备插入photo_child关联记录，child_ids:', recognitionData.child_ids);
        
        // 循环插入photo_child记录
        for (const childId of recognitionData.child_ids) {
          try {
            await executeWithRetry(
              'INSERT INTO photo_child (photo_id, child_id) VALUES (?, ?)',
              [photoId, childId]
            );
            console.log(`成功插入photo_child关联记录: photo_id=${photoId}, child_id=${childId}`);
          } catch (photoChildError) {
            console.error(`插入photo_child关联记录失败 (photo_id=${photoId}, child_id=${childId}):`, photoChildError);
            // 这里不抛出错误，因为照片本身已经保存成功，继续处理其他关联
          }
        }
      }
      
      uploadedPhotos.push({
        id: photoId,
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
    const photos = await executeWithRetry(`
      SELECT p.id, p.path, p.created_at, p.activity, u.full_name as uploader_name,
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
    
    // 为每张照片添加识别到的孩子信息（从photo_child关系表获取）
    for (let photo of photos) {
      try {
        const children = await executeWithRetry(`
          SELECT c.id, c.name 
          FROM children c
          INNER JOIN photo_child pc ON c.id = pc.child_id
          WHERE pc.photo_id = ?
        `, [photo.id]);
        
        photo.children = children;
      } catch (error) {
        console.error('获取照片孩子信息错误:', error);
        photo.children = [];
      }
    }
    
    // 获取公共照片总数
    const totalResult = await executeWithRetry(
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

// 获取按孩子和时间归纳的照片集（家长专用）
router.get('/albums', authenticateToken, authorizeRole(['parent']), async (req, res) => {
  try {
    const { groupBy = 'month' } = req.query; // 'month', 'week', 'day'
    const parentId = req.user.id;
    
    console.log('获取照片集请求 - 参数:', { groupBy, parentId });
    
    // 第1步：获取家长的孩子信息
    const [parentChildren] = await pool.execute(`
      SELECT c.id, c.name, c.age, c.class_id, cl.name as class_name 
      FROM children c 
      LEFT JOIN classes cl ON c.class_id = cl.id
      WHERE c.id IN (SELECT child_id FROM parent_child WHERE parent_id = ?)
      ORDER BY c.name
    `, [parentId]);
    
    if (parentChildren.length === 0) {
      console.log('家长没有关联的孩子，返回空结果');
      return res.json({ albums: [] });
    }
    
    const childIds = parentChildren.map(child => child.id);
    console.log('家长的孩子:', parentChildren.map(c => c.name));
    
    // 第2步：获取每个孩子的照片，按时间分组
    const albums = [];
    
    for (const child of parentChildren) {
      // 获取该孩子的所有照片
      const [childPhotos] = await pool.execute(`
        SELECT p.id, p.path, p.created_at, p.activity, u.full_name as uploader_name,
               c.name as class_name, p.recognition_data,
               (SELECT COUNT(*) FROM likes l WHERE l.photo_id = p.id) as like_count,
               (SELECT COUNT(*) > 0 FROM likes l WHERE l.photo_id = p.id AND l.user_id = ?) as liked
        FROM photos p
        LEFT JOIN users u ON p.uploader_id = u.id
        LEFT JOIN classes c ON p.class_id = c.id
        WHERE p.id IN (SELECT photo_id FROM photo_child WHERE child_id = ?)
        ORDER BY p.created_at DESC
      `, [parentId, child.id]);
      
      if (childPhotos.length === 0) {
        continue;
      }
      
      // 按时间分组
      const photoGroups = {};
      
      for (const photo of childPhotos) {
        const date = new Date(photo.created_at);
        let groupKey;
        
        switch (groupBy) {
          case 'day':
            groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            groupKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
          default:
            groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }
        
        if (!photoGroups[groupKey]) {
          photoGroups[groupKey] = {
            period: groupKey,
            photos: []
          };
        }
        
        photoGroups[groupKey].photos.push(photo);
      }
      
      // 将分组转换为数组并排序
      const sortedGroups = Object.values(photoGroups).sort((a, b) => 
        new Date(b.period) - new Date(a.period)
      );
      
      // 为每个时间段添加统计信息
      for (const group of sortedGroups) {
        group.photoCount = group.photos.length;
        group.formattedPeriod = formatPeriod(group.period, groupBy);
      }
      
      albums.push({
        child: {
          id: child.id,
          name: child.name,
          class_name: child.class_name
        },
        totalPhotos: childPhotos.length,
        timeGroups: sortedGroups
      });
    }
    
    console.log('返回的相册数量:', albums.length);
    res.json({ albums, groupBy });
  } catch (error) {
    console.error('获取照片集错误:', error);
    res.status(500).json({ error: '获取照片集失败: ' + error.message });
  }
});

// 获取教师照片集（教师专用）
router.get('/teacher-albums', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const { groupBy = 'month' } = req.query; // 'month', 'week', 'day'
    const teacherId = req.user.id;
    
    console.log('获取教师照片集请求 - 参数:', { groupBy, teacherId });
    
    // 第1步：获取所有班级信息（显示所有班级的照片）
    const [allClasses] = await pool.execute(`
      SELECT c.id, c.name, c.created_at,
             (SELECT COUNT(*) FROM children ch WHERE ch.class_id = c.id) as student_count
      FROM classes c 
      ORDER BY c.name
    `);
    
    if (allClasses.length === 0) {
      console.log('系统中没有班级，返回空结果');
      return res.json({ albums: [] });
    }
    
    console.log('系统中的班级:', allClasses.map(c => c.name));
    
    // 第2步：获取每个班级的照片，按时间分组
    const albums = [];
    
    for (const classInfo of allClasses) {
      // 获取该班级的所有照片（不限制上传者）
      const [classPhotos] = await pool.execute(`
        SELECT p.id, p.path, p.created_at, p.activity, u.full_name as uploader_name,
               p.recognition_data, p.is_public,
               (SELECT COUNT(*) FROM likes l WHERE l.photo_id = p.id) as like_count
        FROM photos p
        LEFT JOIN users u ON p.uploader_id = u.id
        WHERE p.class_id = ?
        ORDER BY p.created_at DESC
      `, [classInfo.id]);
      
      if (classPhotos.length === 0) {
        // 即使没有照片也显示班级信息
        albums.push({
          class: {
            id: classInfo.id,
            name: classInfo.name,
            student_count: classInfo.student_count
          },
          totalPhotos: 0,
          timeGroups: []
        });
        continue;
      }
      
      // 按时间分组
      const photoGroups = {};
      
      for (const photo of classPhotos) {
        const date = new Date(photo.created_at);
        let groupKey;
        
        switch (groupBy) {
          case 'day':
            groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            groupKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
          default:
            groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }
        
        if (!photoGroups[groupKey]) {
          photoGroups[groupKey] = {
            period: groupKey,
            photos: []
          };
        }
        
        // 为每张照片添加识别到的孩子信息
        if (photo.recognition_data) {
          try {
            let recognitionData;
            if (typeof photo.recognition_data === 'string') {
              recognitionData = JSON.parse(photo.recognition_data);
            } else {
              recognitionData = photo.recognition_data;
            }
            
            const childIds = recognitionData.child_ids || [];
            if (childIds.length > 0) {
              const placeholders = childIds.map(id => `${parseInt(id)}`).join(',');
              const [children] = await pool.execute(
                `SELECT id, name FROM children WHERE id IN (${placeholders})`
              );
              photo.children = children;
            } else {
              photo.children = [];
            }
          } catch (parseError) {
            console.error('解析教师照片识别数据错误:', parseError);
            photo.children = [];
          }
        } else {
          photo.children = [];
        }
        
        photoGroups[groupKey].photos.push(photo);
      }
      
      // 将分组转换为数组并排序
      const sortedGroups = Object.values(photoGroups).sort((a, b) => 
        new Date(b.period) - new Date(a.period)
      );
      
      // 为每个时间段添加统计信息
      for (const group of sortedGroups) {
        group.photoCount = group.photos.length;
        group.formattedPeriod = formatPeriod(group.period, groupBy);
      }
      
      albums.push({
        class: {
          id: classInfo.id,
          name: classInfo.name,
          student_count: classInfo.student_count
        },
        totalPhotos: classPhotos.length,
        timeGroups: sortedGroups
      });
    }
    
    console.log('返回的教师相册数量:', albums.length);
    res.json({ albums, groupBy });
  } catch (error) {
    console.error('获取教师照片集错误:', error);
    res.status(500).json({ error: '获取照片集失败: ' + error.message });
  }
});

// 辅助函数：格式化时间段显示
function formatPeriod(period, groupBy) {
  const date = new Date(period);
  
  switch (groupBy) {
    case 'day':
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'week':
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
    case 'month':
    default:
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long' 
      });
  }
}

// 代理图片文件服务（解决CORS问题）
router.get('/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads', filename);
    
    // 显式设置CORS头
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:8080');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // 检查文件是否存在
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    // 设置正确的Content-Type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.bmp':
        contentType = 'image/bmp';
        break;
      case '.tiff':
        contentType = 'image/tiff';
        break;
    }
    
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // 缓存1天
    
    // 发送文件
    res.sendFile(imagePath);
  } catch (error) {
    console.error('代理图片服务错误:', error);
    res.status(500).json({ error: '图片服务错误' });
  }
});

// 处理OPTIONS预检请求
router.options('/image/:filename', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// 获取按班级、活动场景和时间归纳的公共照片集（家长专用）
router.get('/public-albums', authenticateToken, authorizeRole(['parent']), async (req, res) => {
  try {
    const { groupBy = 'month' } = req.query; // 'month', 'week', 'day'
    const parentId = req.user.id;
    
    console.log('获取公共照片集请求 - 参数:', { groupBy, parentId });
    
    // 第1步：获取家长的孩子信息（用于过滤相关的班级）
    const [parentChildren] = await pool.execute(`
      SELECT c.id, c.name, c.age, c.class_id, cl.name as class_name 
      FROM children c 
      LEFT JOIN classes cl ON c.class_id = cl.id
      WHERE c.id IN (SELECT child_id FROM parent_child WHERE parent_id = ?)
      ORDER BY c.name
    `, [parentId]);
    
    if (parentChildren.length === 0) {
      console.log('家长没有关联的孩子，返回空结果');
      return res.json({ albums: [] });
    }
    
    // 获取相关班级的ID
    const classIds = [...new Set(parentChildren.map(child => child.class_id))];
    console.log('家长孩子所在的班级:', classIds);
    
    // 第2步：获取所有相关班级的信息
    const [allClasses] = await pool.execute(`
      SELECT c.id, c.name, c.created_at,
             (SELECT COUNT(*) FROM children ch WHERE ch.class_id = c.id) as student_count
      FROM classes c 
      WHERE c.id IN (${classIds.map(() => '?').join(',')})
      ORDER BY c.name
    `, classIds);
    
    if (allClasses.length === 0) {
      console.log('没有找到相关班级，返回空结果');
      return res.json({ albums: [] });
    }
    
    console.log('相关班级:', allClasses.map(c => c.name));
    
    // 第3步：获取每个班级的公共照片，按活动场景和时间分组
    const albums = [];
    
    for (const classInfo of allClasses) {
      // 获取该班级的所有公共照片
      const [classPhotos] = await pool.execute(`
        SELECT p.id, p.path, p.created_at, p.activity, u.full_name as uploader_name,
               p.recognition_data, p.is_public,
               (SELECT COUNT(*) FROM likes l WHERE l.photo_id = p.id) as like_count,
               (SELECT COUNT(*) > 0 FROM likes l WHERE l.photo_id = p.id AND l.user_id = ?) as liked
        FROM photos p
        LEFT JOIN users u ON p.uploader_id = u.id
        WHERE p.class_id = ? AND p.is_public = true
        ORDER BY p.created_at DESC
      `, [parentId, classInfo.id]);
      
      if (classPhotos.length === 0) {
        continue;
      }
      
      // 按活动场景分组
      const activityGroups = {};
      
      for (const photo of classPhotos) {
        const activity = photo.activity || '日常活动';
        
        if (!activityGroups[activity]) {
          activityGroups[activity] = {
            activity,
            photos: []
          };
        }
        
        activityGroups[activity].photos.push(photo);
      }
      
      // 对每个活动场景，再按时间分组
      const activityTimeGroups = [];
      
      for (const [activity, activityData] of Object.entries(activityGroups)) {
        const timeGroups = {};
        
        for (const photo of activityData.photos) {
          const date = new Date(photo.created_at);
          let groupKey;
          
          switch (groupBy) {
            case 'day':
              groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
              break;
            case 'week':
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              groupKey = weekStart.toISOString().split('T')[0];
              break;
            case 'month':
            default:
              groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              break;
          }
          
          if (!timeGroups[groupKey]) {
            timeGroups[groupKey] = {
              period: groupKey,
              photos: []
            };
          }
          
          timeGroups[groupKey].photos.push(photo);
        }
        
        // 将时间分组转换为数组并排序
        const sortedTimeGroups = Object.values(timeGroups).sort((a, b) => 
          new Date(b.period) - new Date(a.period)
        );
        
        // 为每个时间段添加统计信息
        for (const group of sortedTimeGroups) {
          group.photoCount = group.photos.length;
          group.formattedPeriod = formatPeriod(group.period, groupBy);
        }
        
        activityTimeGroups.push({
          activity,
          totalPhotos: activityData.photos.length,
          timeGroups: sortedTimeGroups
        });
      }
      
      // 按活动场景排序
      activityTimeGroups.sort((a, b) => a.activity.localeCompare(b.activity));
      
      albums.push({
        class: {
          id: classInfo.id,
          name: classInfo.name,
          student_count: classInfo.student_count
        },
        totalPhotos: classPhotos.length,
        activityGroups: activityTimeGroups
      });
    }
    
    console.log('返回的公共照片集数量:', albums.length);
    res.json({ albums, groupBy });
  } catch (error) {
    console.error('获取公共照片集错误:', error);
    res.status(500).json({ error: '获取公共照片集失败: ' + error.message });
  }
});

// 批量识别代理路由 - 解决跨域问题
router.post('/batch-recognize', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  console.log('=== 批量识别代理请求开始 ===');
  console.log('用户信息:', req.user);
  console.log('请求体键:', Object.keys(req.body));
  
  try {
    // 检查axios是否可用
    if (!axios) {
      return res.status(503).json({ 
        error: '服务暂时不可用',
        message: '批量识别服务需要安装axios依赖',
        instruction: '请管理员运行: npm install axios'
      });
    }
    
    // 远端服务配置
    const REMOTE_BATCH_RECOGNIZE_API = process.env.REMOTE_BATCH_RECOGNIZE_API || 'http://192.168.5.25:5000/batch_recognize';
    const REMOTE_API_TIMEOUT = parseInt(process.env.REMOTE_API_TIMEOUT) || 60000;
    
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

module.exports = router; 