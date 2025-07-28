const express = require('express');
const { pool, executeWithRetry } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

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



// 获取按班级、活动场景和时间归纳的公共照片集（家长专用）
router.get('/public-albums', authenticateToken, authorizeRole(['parent']), async (req, res) => {
  try {
    const { groupBy = 'month' } = req.query; // 'month', 'week', 'day'
    const parentId = req.user.id;
    
    console.log('获取公共照片集请求 - 参数:', { groupBy, parentId });
    
    // 第1步：获取家长的孩子信息（用于显示关联状态）
    const [parentChildren] = await pool.execute(`
      SELECT c.id, c.name, c.age, c.class_id, cl.name as class_name 
      FROM children c 
      LEFT JOIN classes cl ON c.class_id = cl.id
      WHERE c.id IN (SELECT child_id FROM parent_child WHERE parent_id = ?)
      ORDER BY c.name
    `, [parentId]);
    
    // 获取家长孩子所在的班级ID（用于标记关联状态）
    const parentClassIds = [...new Set(parentChildren.map(child => child.class_id))];
    console.log('家长孩子所在的班级:', parentClassIds);
    
    // 第2步：获取所有班级的信息（显示所有班级的公开照片）
    const [allClasses] = await pool.execute(`
      SELECT c.id, c.name, c.created_at,
             (SELECT COUNT(*) FROM children ch WHERE ch.class_id = c.id) as student_count
      FROM classes c 
      ORDER BY c.name
    `);
    
    if (allClasses.length === 0) {
      console.log('没有找到任何班级，返回空结果');
      return res.json({ albums: [] });
    }
    
    console.log('所有班级:', allClasses.map(c => c.name));
    
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
          student_count: classInfo.student_count,
          isParentClass: parentClassIds.includes(classInfo.id) // 标记是否为家长孩子所在的班级
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

module.exports = router; 