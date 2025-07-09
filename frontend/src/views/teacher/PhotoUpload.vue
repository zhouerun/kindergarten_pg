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
            <el-radio :label=0>公开照片</el-radio>
            <el-radio :label=1>私密照片</el-radio>
          </el-radio-group>
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
            accept="image/*"
            :show-file-list="true"
                      >
            <el-icon class="el-icon--upload"><Plus /></el-icon>
            <div class="el-upload__text">
              将文件拖拽到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png/gif文件，且不超过10MB
              </div>
            </template>
          </el-upload>
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
        <el-table-column prop="recognitionResult" label="识别结果">
          <template #default="scope">
            <span v-if="scope.row.recognitionResult">
              识别到 {{ scope.row.recognitionResult.length }} 名学生
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import axios from 'axios';

export default {
  name: 'PhotoUpload',
  components: {
    Plus
  },
  setup() {
    const store = useStore();
    const uploadRef = ref(null);
    const uploading = ref(false);
    const fileList = ref([]);
    const classes = ref([]);
    const uploadHistory = ref([]);
    
    const uploadForm = reactive({
      classId: null,
      isPublic: 1
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
      const isImage = file.type.startsWith('image/');
      const isLt10M = file.size / 1024 / 1024 < 10;
      
      if (!isImage) {
        ElMessage.error('只能上传图片文件!');
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
        // 创建FormData对象
        const formData = new FormData();
        formData.append('classId', uploadForm.classId);
        formData.append('isPublic', uploadForm.isPublic);
        
        // 添加所有文件到FormData
        fileList.value.forEach(file => {
          formData.append('images', file.raw); // file.raw是实际的File对象
        });
        
        console.log('开始上传，文件数量:', fileList.value.length);
        
        // 发送上传请求到正确的端点
        const response = await axios.post('/photos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${store.state.token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`上传进度: ${percentCompleted}%`);
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
      handleFileChange,
      beforeUpload,
      handleUpload,
      handleSuccess,
      handleError,
      handleRemove,
      clearFiles
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
</style> 