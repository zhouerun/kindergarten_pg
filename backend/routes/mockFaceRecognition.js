const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

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

// 模拟人脸质量检测函数
const simulateFaceQualityCheck = async (imageBuffer, originalName) => {
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const randomScore = Math.random();
  
  // 模拟各种检测结果
  let faceDetected = randomScore > 0.1; // 90%概率检测到人脸
  let qualityScore = 0;
  let faceQuality = 'poor';
  
  if (faceDetected) {
    // 如果检测到人脸，生成质量分数
    qualityScore = 0.3 + Math.random() * 0.7; // 0.3-1.0之间
    
    if (qualityScore >= 0.8) {
      faceQuality = 'excellent';
    } else if (qualityScore >= 0.6) {
      faceQuality = 'good';
    } else if (qualityScore >= 0.4) {
      faceQuality = 'fair';
    } else {
      faceQuality = 'poor';
    }
  }
  
  // 模拟人脸特征提取
  const faceFeatures = faceDetected ? {
    face_encoding: Array.from({length: 128}, () => Math.random()),
    face_landmarks: {
      left_eye: [Math.random() * 100, Math.random() * 100],
      right_eye: [Math.random() * 100, Math.random() * 100],
      nose: [Math.random() * 100, Math.random() * 100],
      mouth: [Math.random() * 100, Math.random() * 100]
    },
    face_box: {
      x: Math.random() * 50,
      y: Math.random() * 50,
      width: 50 + Math.random() * 100,
      height: 50 + Math.random() * 100
    }
  } : null;
  
  return {
    filename: originalName,
    faceDetected,
    qualityScore: Math.round(qualityScore * 100) / 100,
    faceQuality,
    faceFeatures,
    fileSize: imageBuffer.length,
    processTime: Date.now()
  };
};

// 内存中存储模拟数据
const mockTrainingData = new Map(); // childId -> training data

// 模拟上传人脸识别训练数据
router.post('/upload-training-data', 
  authenticateToken, 
  authorizeRole(['parent']), 
  upload.array('faceImages', 10), 
  async (req, res) => {
    console.log('=== 模拟人脸识别训练数据上传开始 ===');
    console.log('用户信息:', req.user);
    console.log('请求体:', req.body);
    console.log('文件数量:', req.files ? req.files.length : 0);
    
    try {
      const { childId } = req.body;
      const uploaderId = req.user.id;
      
      if (!childId) {
        return res.status(400).json({ error: '孩子ID不能为空' });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '请选择要上传的孩子照片' });
      }
      
      // 模拟孩子信息（在真实环境中应该从数据库查询）
      const mockChild = {
        id: parseInt(childId),
        name: '小明',
        student_number: '2024001',
        class_name: '大班一班'
      };
      
      console.log(`为孩子 ${mockChild.name} (ID: ${childId}) 上传 ${req.files.length} 张训练图片`);
      
      const uploadResults = [];
      let successCount = 0;
      let qualityIssueCount = 0;
      
      // 处理每个上传的文件
      for (const file of req.files) {
        console.log(`处理文件: ${file.originalname}, 大小: ${file.size} bytes`);
        
        try {
          // 进行人脸质量检测
          const qualityResult = await simulateFaceQualityCheck(file.buffer, file.originalname);
          console.log(`人脸质量检测结果:`, qualityResult);
          
          uploadResults.push({
            filename: file.originalname,
            status: 'success',
            faceDetected: qualityResult.faceDetected,
            qualityScore: qualityResult.qualityScore,
            faceQuality: qualityResult.faceQuality,
            needsReview: !qualityResult.faceDetected || qualityResult.qualityScore < 0.5,
            fileSize: file.size,
            processTime: new Date().toISOString()
          });
          
          if (qualityResult.faceDetected && qualityResult.qualityScore >= 0.5) {
            successCount++;
          } else {
            qualityIssueCount++;
          }
          
        } catch (error) {
          console.error(`处理文件 ${file.originalname} 失败:`, error);
          uploadResults.push({
            filename: file.originalname,
            status: 'error',
            error: error.message
          });
        }
      }
      
      // 存储到内存中的模拟数据
      const existingData = mockTrainingData.get(childId) || {
        childId: parseInt(childId),
        childInfo: mockChild,
        images: [],
        totalImages: 0,
        successCount: 0,
        qualityIssueCount: 0
      };
      
      // 更新模拟数据
      existingData.images.push(...uploadResults.filter(r => r.status === 'success'));
      existingData.totalImages += uploadResults.filter(r => r.status === 'success').length;
      existingData.successCount += successCount;
      existingData.qualityIssueCount += qualityIssueCount;
      existingData.lastUploadTime = new Date().toISOString();
      
      mockTrainingData.set(childId, existingData);
      
      // 返回结果
      const response = {
        message: '人脸识别训练数据上传完成（模拟）',
        childInfo: mockChild,
        results: uploadResults,
        summary: {
          totalUploaded: req.files.length,
          successCount,
          qualityIssueCount,
          recommendation: getUploadRecommendation(existingData.successCount, existingData.qualityIssueCount)
        },
        mockNote: '这是模拟功能，数据未真正存储到数据库'
      };
      
      console.log('模拟上传完成，返回结果:', response);
      res.json(response);
      
    } catch (error) {
      console.error('模拟人脸识别训练数据上传错误:', error);
      res.status(500).json({ error: '上传失败: ' + error.message });
    }
  }
);

// 获取孩子的人脸训练数据状态（模拟）
router.get('/training-status/:childId', 
  authenticateToken, 
  authorizeRole(['parent']), 
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      console.log(`获取孩子 ${childId} 的训练状态（模拟）`);
      
      // 从内存中获取模拟数据
      const trainingData = mockTrainingData.get(childId) || {
        childId: parseInt(childId),
        childInfo: {
          id: parseInt(childId),
          name: '小明',
          student_number: '2024001',
          class_name: '大班一班'
        },
        images: [],
        totalImages: 0,
        successCount: 0,
        qualityIssueCount: 0
      };
      
      const approvedImages = trainingData.images.filter(img => 
        img.faceDetected && img.qualityScore >= 0.5
      ).length;
      
      const averageQuality = trainingData.images.length > 0 
        ? trainingData.images.reduce((sum, img) => sum + (img.qualityScore || 0), 0) / trainingData.images.length
        : 0;
      
      const trainingStatus = {
        childId: parseInt(childId),
        childInfo: trainingData.childInfo,
        totalImages: trainingData.totalImages,
        approvedImages: approvedImages,
        averageQuality: Math.round(averageQuality * 100) / 100,
        goodQualityImages: trainingData.images.filter(img => img.qualityScore >= 0.6).length,
        trainingCompleted: approvedImages >= 5,
        images: trainingData.images.map(img => ({
          id: Date.now() + Math.random(), // 模拟ID
          image_name: img.filename,
          quality_score: img.qualityScore,
          face_detected: img.faceDetected,
          face_quality: img.faceQuality,
          status: img.faceDetected && img.qualityScore >= 0.5 ? 'approved' : 'pending',
          upload_time: img.processTime
        })),
        requirements: {
          minImages: 5,
          minQuality: 0.6,
          currentStatus: approvedImages >= 5 ? 'completed' : 'incomplete'
        },
        mockNote: '这是模拟数据，未真正存储到数据库'
      };
      
      res.json(trainingStatus);
      
    } catch (error) {
      console.error('获取模拟训练状态错误:', error);
      res.status(500).json({ error: '获取训练状态失败' });
    }
  }
);

// 删除人脸训练数据（模拟）
router.delete('/training-data/:imageId', 
  authenticateToken, 
  authorizeRole(['parent']), 
  async (req, res) => {
    try {
      const { imageId } = req.params;
      
      console.log(`删除训练数据 ${imageId}（模拟）`);
      
      // 模拟删除操作
      let found = false;
      for (const [childId, data] of mockTrainingData) {
        const imageIndex = data.images.findIndex(img => 
          img.filename === imageId || img.processTime === imageId
        );
        if (imageIndex !== -1) {
          data.images.splice(imageIndex, 1);
          data.totalImages = Math.max(0, data.totalImages - 1);
          found = true;
          break;
        }
      }
      
      if (!found) {
        return res.status(404).json({ error: '未找到指定的训练数据' });
      }
      
      res.json({ 
        message: '训练数据删除成功（模拟）',
        mockNote: '这是模拟操作，未真正删除数据库中的数据'
      });
      
    } catch (error) {
      console.error('删除模拟训练数据错误:', error);
      res.status(500).json({ error: '删除失败' });
    }
  }
);

// 清空所有模拟数据（开发测试用）
router.post('/clear-mock-data', 
  authenticateToken, 
  authorizeRole(['parent']), 
  async (req, res) => {
    try {
      mockTrainingData.clear();
      res.json({ 
        message: '所有模拟数据已清空',
        mockNote: '这仅清空内存中的模拟数据'
      });
    } catch (error) {
      res.status(500).json({ error: '清空数据失败' });
    }
  }
);

// 辅助函数：获取上传建议
function getUploadRecommendation(successCount, qualityIssueCount) {
  if (successCount >= 5) {
    return {
      status: 'sufficient',
      message: '训练数据充足，可以进行人脸识别',
      action: 'complete'
    };
  } else if (successCount >= 3) {
    return {
      status: 'nearly_sufficient',
      message: `还需要上传 ${5 - successCount} 张高质量照片`,
      action: 'upload_more'
    };
  } else {
    return {
      status: 'insufficient',
      message: '训练数据不足，请上传更多清晰的孩子正面照片',
      action: 'upload_more',
      tips: [
        '请确保照片中孩子的面部清晰可见',
        '避免侧脸、背光或模糊的照片',
        '建议上传不同角度和表情的照片',
        '照片中孩子应该是主体，避免多人合照'
      ]
    };
  }
}

module.exports = router; 