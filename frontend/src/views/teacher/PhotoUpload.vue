<template>
  <div class="photo-upload-container">
    <div class="page-header">
      <h1>照片上传</h1>
      <p>批量上传班级照片，系统将自动识别照片中的学生</p>
    </div>
    
    <el-card>
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="目标班级">
          <el-select v-model="uploadForm.classId" placeholder="请选择班级">
            <el-option 
              v-for="cls in classes" 
              :key="cls.id" 
              :label="cls.name" 
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="照片类型">
          <el-radio-group v-model="uploadForm.isPublic">
            <el-radio :label=1>公开照片</el-radio>
            <el-radio :label=0>私密照片</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="活动场景">
          <el-select v-model="uploadForm.activity" placeholder="请选择活动场景">
            <el-option 
              v-for="activity in activityOptions" 
              :key="activity.value" 
              :label="activity.label" 
              :value="activity.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="照片上传">
          <el-upload
            class="upload-demo"
            ref="uploadRef"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :file-list="fileList"
            multiple
            accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp"
            :show-file-list="false"
                      >
            <el-icon class="el-icon--upload"><Plus /></el-icon>
            <div class="el-upload__text">
              将文件拖拽到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 JPG、JPEG、PNG、BMP、TIFF、WEBP 文件，且不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <!-- 照片预览区域 -->
        <el-form-item v-if="fileList.length > 0" label="照片预览">
          <div class="photo-preview-container">
            <div class="preview-header">
              <span class="preview-count">已选择 {{ fileList.length }} 张照片</span>
              <el-button type="text" @click="clearFiles" class="clear-all-btn">
                <el-icon><Delete /></el-icon>
                清空所有
              </el-button>
            </div>
            
            <div class="photo-grid">
              <div 
                v-for="(file, index) in fileList" 
                :key="file.uid"
                class="photo-item"
              >
                <div class="photo-wrapper">
                  <img 
                    :src="getFilePreviewUrl(file)" 
                    :alt="file.name"
                    class="photo-thumbnail"
                    @click="previewPhoto(file, index)"
                  />
                  <div class="photo-overlay">
                    <div class="photo-actions">
                      <el-button 
                        type="primary" 
                        size="small" 
                        circle 
                        @click="previewPhoto(file, index)"
                        class="action-btn"
                      >
                        <el-icon><ZoomIn /></el-icon>
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        circle 
                        @click="removePhoto(index)"
                        class="action-btn"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                  <div class="photo-info">
                    <span class="photo-name" :title="file.name">{{ file.name }}</span>
                    <span class="photo-size">{{ formatFileSize(file.size) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleUpload"
            :loading="uploading"
            :disabled="fileList.length === 0 || !uploadForm.classId"
          >
            开始上传
          </el-button>
          <el-button @click="clearFiles">清空文件</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <!-- 上传历史 -->
    <el-card v-if="uploadHistory.length > 0" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>上传历史</span>
        </div>
      </template>
      
      <el-table :data="uploadHistory" style="width: 100%">
        <el-table-column prop="filename" label="文件名" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === 'success' ? 'success' : 'danger'"
            >
              {{ scope.row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="uploadTime" label="上传时间" width="180" />
      </el-table>
    </el-card>
    
    <!-- 照片预览对话框 -->
    <el-dialog 
      v-model="showPreviewDialog" 
      title="照片预览" 
      width="80%"
      center
      :before-close="closePreviewDialog"
    >
      <div class="preview-dialog-content">
        <div class="preview-image-container">
          <img 
            v-if="currentPreviewFile"
            :src="getFilePreviewUrl(currentPreviewFile)" 
            :alt="currentPreviewFile.name"
            class="preview-image"
          />
        </div>
        
        <div class="preview-info">
          <div class="info-row">
            <span class="info-label">文件名：</span>
            <span class="info-value">{{ currentPreviewFile?.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">文件大小：</span>
            <span class="info-value">{{ formatFileSize(currentPreviewFile?.size) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">文件类型：</span>
            <span class="info-value">{{ currentPreviewFile?.raw?.type }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">最后修改：</span>
            <span class="info-value">{{ formatDate(currentPreviewFile?.raw?.lastModified) }}</span>
          </div>
        </div>
        
        <div class="preview-navigation" v-if="fileList.length > 1">
          <el-button 
            @click="prevPhoto" 
            :disabled="currentPreviewIndex === 0"
            type="primary"
          >
            <el-icon><ArrowLeft /></el-icon>
            上一张
          </el-button>
          <span class="nav-info">{{ currentPreviewIndex + 1 }} / {{ fileList.length }}</span>
          <el-button 
            @click="nextPhoto" 
            :disabled="currentPreviewIndex === fileList.length - 1"
            type="primary"
          >
            下一张
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closePreviewDialog">关闭</el-button>
          <el-button type="danger" @click="removeCurrentPhoto">
            <el-icon><Delete /></el-icon>
            删除当前照片
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { Plus, Delete, ZoomIn, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import axios from 'axios';

export default {
  name: 'PhotoUpload',
  components: {
    Plus,
    Delete,
    ZoomIn,
    ArrowLeft,
    ArrowRight
  },
  setup() {
    const store = useStore();
    const uploadRef = ref(null);
    const uploading = ref(false);
    const fileList = ref([]);
    const classes = ref([]);
    const uploadHistory = ref([]);
    
    // 照片预览相关状态
    const showPreviewDialog = ref(false);
    const currentPreviewFile = ref(null);
    const currentPreviewIndex = ref(0);
    
    // 活动场景选项
    const activityOptions = ref([
      { value: '户外活动', label: '户外活动' },
      { value: '室内游戏', label: '室内游戏' },
      { value: '美术手工', label: '美术手工' },
      { value: '音乐舞蹈', label: '音乐舞蹈' },
      { value: '体育运动', label: '体育运动' },
      { value: '科学实验', label: '科学实验' },
      { value: '阅读时间', label: '阅读时间' },
      { value: '午餐时间', label: '午餐时间' },
      { value: '午休时间', label: '午休时间' },
      { value: '集体活动', label: '集体活动' },
      { value: '自由活动', label: '自由活动' },
      { value: '节日庆祝', label: '节日庆祝' },
      { value: '生日聚会', label: '生日聚会' },
      { value: '其他', label: '其他' },
      { value: '其他', label: '其他' }
    ]);
    
    const uploadForm = reactive({
      classId: null,
      isPublic: 1,
      activity: null
    });
    
    const uploadHeaders = computed(() => ({
      'Authorization': `Bearer ${store.getters.token}`
    }));
    
    const uploadData = computed(() => ({
      classId: uploadForm.classId,
      isPublic: uploadForm.isPublic
    }));
    
    const loadClasses = async () => {
      try {
        const response = await axios.get('/classes');
        classes.value = response.data;
        
        // 默认选择第一个班级
        if (classes.value.length > 0) {
          uploadForm.classId = classes.value[0].id;
        }
      } catch (error) {
        ElMessage.error('加载班级列表失败');
      }
    };
    
    const beforeUpload = (file) => {
      console.log(file);
      
      // 允许的图片类型（MIME类型）
      const allowedTypes = [
        'image/jpeg',    // .jpg, .jpeg
        'image/png',     // .png
        'image/bmp',     // .bmp
        'image/tiff',    // .tiff
        'image/webp'     // .webp
      ];
      
      const isValidImage = allowedTypes.includes(file.type);
      const isLt10M = file.size / 1024 / 1024 < 10;
      
      if (!isValidImage) {
        ElMessage.error('只能上传 JPG、JPEG、PNG、BMP、TIFF、WEBP 格式的图片!');
        return false;
      }
      if (!isLt10M) {
        ElMessage.error('上传图片大小不能超过 10MB!');
        return false;
      }
      return true;
    };
    
    const handleUpload = async () => {
      if (!uploadForm.classId) {
        ElMessage.error('请选择目标班级');
        return;
      }
      
      if (fileList.value.length === 0) {
        ElMessage.error('请选择要上传的文件');
        return;
      }
      
      uploading.value = true;
      try {
        // 将文件转换为base64的辅助函数
        const fileToBase64 = (file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
        };

        // 转换所有文件为base64
        const base64Images = await Promise.all(
          fileList.value.map(file => fileToBase64(file.raw))
        );

        // 构造要发送的JSON对象，确保uploadForm中的数据被带上
        const payload = {
          class_id: fileList.value.map(() => uploadForm.classId),
          is_public: fileList.value.map(() => uploadForm.isPublic),
          activity_detail: fileList.value.map(() => uploadForm.activity || ''),
          uploader_id: fileList.value.map(() => store.state.user?.id || store.state.userId),
          images: base64Images
        };
        
        console.log('开始上传，文件数量:', fileList.value.length, '上传表单数据:', uploadForm);
        
        // 发送上传请求到本地代理服务（解决跨域问题）
        const response = await axios.post('/photos/batch-recognize', payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${store.state.token}`
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`上传进度: ${percentCompleted}%`);
            }
          }
        });
        
        console.log('上传成功:', response.data);
        ElMessage.success(`成功上传 ${fileList.value.length} 个文件`);
        
        // 添加到上传历史
        fileList.value.forEach(file => {
          uploadHistory.value.unshift({
            filename: file.name,
            status: 'success',
            recognitionResult: response.data.photos?.[0]?.recognition_data?.child_ids || [],
            uploadTime: new Date().toLocaleString()
          });
        });
        
        // 清空文件列表
        clearFiles();
        
      } catch (error) {
        console.error('上传失败:', error);
        ElMessage.error('上传失败: ' + (error.response?.data?.error || error.message));
        
        // 添加失败记录
        fileList.value.forEach(file => {
          uploadHistory.value.unshift({
            filename: file.name,
            status: 'error',
            recognitionResult: null,
            uploadTime: new Date().toLocaleString()
          });
        });
      } finally {
        uploading.value = false;
      }
    };
    
    const handleSuccess = (response, file) => {
      ElMessage.success(`${file.name} 上传成功`);
      
      // 添加到上传历史
      uploadHistory.value.unshift({
        filename: file.name,
        status: 'success',
        recognitionResult: response.recognition_data?.child_ids || [],
        uploadTime: new Date().toLocaleString()
      });
      
      // 移除已上传的文件
      const index = fileList.value.findIndex(f => f.uid === file.uid);
      if (index > -1) {
        fileList.value.splice(index, 1);
      }
    };
    
    const handleError = (error, file) => {
      ElMessage.error(`${file.name} 上传失败`);
      
      // 添加到上传历史
      uploadHistory.value.unshift({
        filename: file.name,
        status: 'error',
        recognitionResult: null,
        uploadTime: new Date().toLocaleString()
      });
    };
    
    const handleRemove = (file, newFileList) => {
      console.log('移除文件:', file.name);
      console.log('移除后文件列表长度:', newFileList.length);
      
      // 更新文件列表
      fileList.value = newFileList;
      
      // 用户反馈
      ElMessage.info(`已移除文件: ${file.name}`);
    };
    
    const clearFiles = () => {
      fileList.value = [];
      uploadRef.value.clearFiles();
    };

    const handleFileChange = (file, newFileList) => {
      console.log('文件变化:', file, newFileList);
      console.log('当前文件列表长度:', newFileList.length);
      
      // 更新文件列表（修复参数名冲突）
      fileList.value = newFileList;
      
      // 用户反馈
      if (file.status === 'ready') {
        ElMessage.success(`已选择文件: ${file.name}`);
      }
      
      // 调试信息
      console.log('更新后的fileList.value长度:', fileList.value.length);
    };
    
    // 照片预览相关函数
    const getFilePreviewUrl = (file) => {
      if (file.raw) {
        return URL.createObjectURL(file.raw);
      }
      return '';
    };
    
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      return new Date(timestamp).toLocaleString('zh-CN');
    };
    
    const previewPhoto = (file, index) => {
      currentPreviewFile.value = file;
      currentPreviewIndex.value = index;
      showPreviewDialog.value = true;
    };
    
    const closePreviewDialog = () => {
      showPreviewDialog.value = false;
      currentPreviewFile.value = null;
      currentPreviewIndex.value = 0;
    };
    
    const removePhoto = (index) => {
      const removedFile = fileList.value[index];
      fileList.value.splice(index, 1);
      
      ElMessage.info(`已移除文件: ${removedFile.name}`);
      
      // 如果预览对话框是打开的，需要更新
      if (showPreviewDialog.value) {
        if (fileList.value.length === 0) {
          closePreviewDialog();
        } else if (currentPreviewIndex.value >= fileList.value.length) {
          currentPreviewIndex.value = fileList.value.length - 1;
          currentPreviewFile.value = fileList.value[currentPreviewIndex.value];
        } else {
          // 更新当前预览文件
          currentPreviewFile.value = fileList.value[currentPreviewIndex.value];
        }
      }
    };
    
    const removeCurrentPhoto = () => {
      if (currentPreviewFile.value && currentPreviewIndex.value >= 0) {
        removePhoto(currentPreviewIndex.value);
      }
    };
    
    const prevPhoto = () => {
      if (currentPreviewIndex.value > 0) {
        currentPreviewIndex.value--;
        currentPreviewFile.value = fileList.value[currentPreviewIndex.value];
      }
    };
    
    const nextPhoto = () => {
      if (currentPreviewIndex.value < fileList.value.length - 1) {
        currentPreviewIndex.value++;
        currentPreviewFile.value = fileList.value[currentPreviewIndex.value];
      }
    };
    
    onMounted(() => {
      loadClasses();
    });
    
    return {
      uploadRef,
      uploading,
      fileList,
      classes,
      uploadForm,
      uploadHeaders,
      uploadData,
      uploadHistory,
      activityOptions,
      handleFileChange,
      beforeUpload,
      handleUpload,
      handleSuccess,
      handleError,
      handleRemove,
      clearFiles,
      // 照片预览相关
      showPreviewDialog,
      currentPreviewFile,
      currentPreviewIndex,
      getFilePreviewUrl,
      formatFileSize,
      formatDate,
      previewPhoto,
      closePreviewDialog,
      removePhoto,
      removeCurrentPhoto,
      prevPhoto,
      nextPhoto
    };
  }
};
</script>

<style scoped>
.photo-upload-container {
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #303133;
  margin-bottom: 10px;
}

.page-header p {
  color: #909399;
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}

/* 照片预览样式 */
.photo-preview-container {
  width: 100%;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.preview-count {
  font-size: 14px;
  color: #606266;
  font-weight: bold;
}

.clear-all-btn {
  color: #f56c6c;
  padding: 5px 10px;
}

.clear-all-btn:hover {
  color: #f56c6c;
  background-color: #fef0f0;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.photo-wrapper {
  position: relative;
  background: #f8f9fa;
}

.photo-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  cursor: pointer;
  display: block;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
}

.photo-info {
  padding: 8px;
  background: white;
  border-top: 1px solid #ebeef5;
}

.photo-name {
  display: block;
  font-size: 12px;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-size {
  font-size: 11px;
  color: #909399;
}

/* 预览对话框样式 */
.preview-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.preview-image-container {
  max-width: 100%;
  max-height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  width: 100%;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-row {
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: bold;
  color: #606266;
  margin-right: 8px;
  min-width: 80px;
}

.info-value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

.preview-navigation {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-info {
  font-size: 14px;
  color: #606266;
  font-weight: bold;
  padding: 0 15px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .photo-thumbnail {
    height: 100px;
  }
  
  .preview-info {
    grid-template-columns: 1fr;
  }
  
  .preview-navigation {
    flex-direction: column;
    gap: 10px;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 