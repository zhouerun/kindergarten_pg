<template>
  <div class="child-binding-container">
    <div class="page-header">
      <h1>绑定我的孩子</h1>
      <p>输入您孩子的学号来建立关联关系</p>
    </div>
    
    <!-- 当前已绑定的孩子 -->
    <el-card style="margin-bottom: 20px;" v-if="boundChildren.length > 0">
      <template #header>
        <div class="card-header">
          <span>已绑定的孩子</span>
        </div>
      </template>
      
      <div class="bound-children">
        <div 
          v-for="child in boundChildren" 
          :key="child.id"
          class="child-item"
        >
          <el-tag size="large" type="success">
            <el-icon><User /></el-icon>
            {{ child.name }} (学号: {{ child.student_number }})
          </el-tag>
          <span class="child-class">{{ child.class_name }}</span>
          <el-button 
            type="danger" 
            size="small" 
            @click="unbindChild(child)"
            :loading="unbinding"
          >
            解绑
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 绑定新孩子 -->
    <el-card v-if="!showFaceUpload">
      <template #header>
        <div class="card-header">
          <span>绑定新孩子</span>
        </div>
      </template>
      
      <el-form 
        ref="bindingForm" 
        :model="bindingFormData" 
        :rules="bindingRules"
        label-width="100px"
        @submit.prevent="bindChild"
      >
        <el-form-item label="学号" prop="studentNumber">
          <el-input 
            v-model="bindingFormData.studentNumber" 
            placeholder="请输入孩子的学号"
            style="width: 300px;"
            @keyup.enter="bindChild"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="bindChild"
            :loading="binding"
          >
            绑定孩子
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 人脸识别数据上传 -->
    <el-card v-if="showFaceUpload">
      <template #header>
        <div class="card-header">
          <span>上传孩子照片 - {{ currentChild && currentChild.name ? currentChild.name : '' }}</span>
          <el-button @click="skipFaceUpload" type="text">稍后上传</el-button>
        </div>
      </template>
      
      <el-alert
        title="为了更好的照片识别效果，请上传孩子的清晰照"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #default>
          <p>• 需要至多5张高质量照片</p>
          <p>• 请确保孩子面部清晰可见</p>
          <p>• 建议上传不同角度和表情的照片</p>
          <p>• 避免多人合照或背光照片</p>
        </template>
      </el-alert>
      
      <!-- 文件上传区域 -->
      <el-upload
        ref="faceUploadRef"
        class="face-upload"
        drag
        :auto-upload="false"
        :on-change="handleFaceFileChange"
        :on-remove="handleFaceFileRemove"
        :before-upload="beforeFaceUpload"
        :file-list="faceFileList"
        multiple
        accept=".jpg,.jpeg,.png"
        :show-file-list="true"
        style="margin: 20px 0;"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将孩子照片拖拽到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 JPG、JPEG、PNG、BMP、TIFF、WEBP 格式的照片，单张不超过5MB
          </div>
        </template>
      </el-upload>
      
      <!-- 上传按钮 -->
      <div class="upload-actions">
        <el-button 
          type="primary" 
          @click="uploadFaceImages"
          :loading="faceUploading"
          :disabled="faceFileList.length === 0"
        >
          {{ `上传照片 (${faceFileList.length})` }}
        </el-button>
        <el-button @click="clearFaceFiles">清空文件</el-button>

      </div>
    </el-card>
    
    <!-- 绑定说明 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>绑定说明</span>
        </div>
      </template>
      
      <div class="binding-instructions">
        <h4>如何获取学号？</h4>
        <ol>
          <li>学号由班级老师提供</li>
          <li>您可以联系孩子的班主任获取正确的学号</li>
          <li>每个孩子都有唯一的学号，请确保输入正确</li>
          <li>绑定成功后，您就可以查看孩子在幼儿园的照片</li>
        </ol>
        
        <h4>注意事项：</h4>
        <ul>
          <li>请确保输入的学号格式正确</li>
          <li>如果提示"学号有误"，请检查学号是否正确</li>
          <li>每个家长可以绑定多个孩子</li>
          <li>如需解绑，请点击对应孩子旁边的"解绑"按钮</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { User, Upload } from '@element-plus/icons-vue';
import api from '@/utils/axios';

export default {
  name: 'ChildBinding',
  components: {
    User,
    Upload
  },
  setup() {
    const binding = ref(false);
    const unbinding = ref(false);
    const bindingForm = ref(null);
    const boundChildren = ref([]);
    
    // 人脸识别相关状态
    const showFaceUpload = ref(false);
    const currentChild = ref(null);
    const faceUploading = ref(false);
    const faceUploadRef = ref(null);
    const faceFileList = ref([]);
    
    const bindingFormData = reactive({
      studentNumber: ''
    });
    
    const bindingRules = {
      studentNumber: [
        { required: true, message: '请输入学号', trigger: 'blur' },
        { min: 1, max: 20, message: '学号长度应在1-20个字符之间', trigger: 'blur' }
      ]
    };
    
    const loadBoundChildren = async () => {
      try {
        const response = await api.get('/users/children');
        boundChildren.value = response.data;
      } catch (error) {
        console.error('加载已绑定孩子列表失败:', error);
      }
    };
    
    const bindChild = async () => {
      try {
        const valid = await bindingForm.value.validate();
        if (!valid) return;
        
        binding.value = true;
        
        const response = await api.post('/users/bind-child', {
          studentNumber: bindingFormData.studentNumber
        });
        
        ElMessage.success('绑定成功！现在请上传孩子的照片进行人脸识别训练');
        
        // 绑定成功后，显示人脸识别数据上传界面
        currentChild.value = response.data.child;
        showFaceUpload.value = true;
        
        resetForm();
        loadBoundChildren();
      } catch (error) {
        const errorMessage = error.response?.data?.error || '绑定失败';
        ElMessage.error(errorMessage);
      } finally {
        binding.value = false;
      }
    };
    
    const unbindChild = async (child) => {
      try {
        await ElMessageBox.confirm(
          `确定要解绑孩子 "${child.name}" (学号: ${child.student_number}) 吗？解绑后将无法查看该孩子的照片。`,
          '确认解绑',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        unbinding.value = true;
        
        await api.delete('/users/bind-child', {
          data: { childId: child.id }
        });
        
        ElMessage.success('解绑成功！');
        loadBoundChildren();
      } catch (error) {
        if (error !== 'cancel') {
          const errorMessage = error.response?.data?.error || '解绑失败';
          ElMessage.error(errorMessage);
        }
      } finally {
        unbinding.value = false;
      }
    };
    
    const resetForm = () => {
      bindingFormData.studentNumber = '';
      bindingForm.value?.resetFields();
    };
  
    
    const beforeFaceUpload = (file) => {
      const isImage = ['image/jpg','image/jpeg','image/png','image/bmp','image/tiff','image/webp'].includes(file.type);
      const isLt10M = file.size / 1024 / 1024 < 10;
      
      if (!isImage) {
        ElMessage.error('只能上传 JPG、JPEG、PNG、BMP、TIFF、WEBP 格式的照片!');
        return false;
      }
      if (!isLt10M) {
        ElMessage.error('照片大小不能超过 10MB!');
        return false;
      }
      return true;
    };
    
    const handleFaceFileChange = (file, fileList) => {
      faceFileList.value = fileList;
    };
    
    const handleFaceFileRemove = (file, fileList) => {
      faceFileList.value = fileList;
    };
    
    const clearFaceFiles = () => {
      faceFileList.value = [];
      faceUploadRef.value?.clearFiles();
    };
    
    // 将文件转换为base64格式
    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    };

    const uploadFaceImages = async () => {
      if (!currentChild.value) {
        ElMessage.error('请先绑定孩子');
        return;
      }
      
      if (faceFileList.value.length === 0) {
        ElMessage.error('请选择要上传的照片');
        return;
      }
      
      faceUploading.value = true;
      
      try {
        // 转换所有图片为base64格式
        const images = [];
        for (const file of faceFileList.value) {
          try {
            const base64 = await fileToBase64(file.raw);
            images.push(base64);
          } catch (error) {
            ElMessage.error(`图片${file.name}转换失败`);
            return;
          }
        }
        
        // 按照start_system.py格式构建请求数据
        const requestData = {
          name: currentChild.value.name,
          images: images,
          profile: {
            age: currentChild.value.age
          }
        };
        
        console.log('发送训练数据:', {
          name: requestData.name,
          imagesCount: requestData.images.length,
          age: requestData.profile.age
        });
        
        const response = await api.post('/face-recognition/database/add_child', requestData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
              // 检查远端返回的success状态
      if (response.data.success === true) {
        ElMessage.success('人脸识别训练成功！孩子绑定已完成');
        
        // 绑定成功后，隐藏上传界面
        showFaceUpload.value = false;
        currentChild.value = null;
        clearFaceFiles();
        
        // 重新加载已绑定的孩子列表
        await loadBoundChildren();
        
        return; // 阻止继续执行
      }
        
        // 如果success不为true，显示其他消息
        ElMessage.success(response.data.message);
        
        // 显示上传结果
        const summary = response.data.summary;
        if (summary?.recommendation?.status === 'insufficient') {
          ElMessage.warning(summary.recommendation.message);
        } else if (summary?.recommendation?.status === 'sufficient') {
          ElMessage.success('人脸识别训练数据充足，可以完成绑定！');
        } else if (summary?.recommendation?.status === 'submitted') {
          ElMessage.success('训练数据已提交到远端服务进行处理！');
        }
        
        // 清空文件列表
        clearFaceFiles();
        
      } catch (error) {
        console.error('上传错误:', error);
        ElMessage.error(error.response?.data?.error || '上传失败');
      } finally {
        faceUploading.value = false;
      }
    };
    

    
    const skipFaceUpload = () => {
      showFaceUpload.value = false;
      currentChild.value = null;
      clearFaceFiles();
    };
    

    
    onMounted(() => {
      loadBoundChildren();
    });
    
    return {
      binding,
      unbinding,
      bindingForm,
      boundChildren,
      bindingFormData,
      bindingRules,
      bindChild,
      unbindChild,
      resetForm,
      // 人脸识别相关
      showFaceUpload,
      currentChild,
      faceUploading,
      faceUploadRef,
      faceFileList,
      beforeFaceUpload,
      handleFaceFileChange,
      handleFaceFileRemove,
      clearFaceFiles,
      uploadFaceImages,
      skipFaceUpload
    };
  }
};
</script>

<style scoped>
.child-binding-container {
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
  font-weight: bold;
}

.bound-children {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.child-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.child-class {
  color: #666;
  font-size: 14px;
  flex: 1;
}

.binding-instructions {
  line-height: 1.6;
}

.binding-instructions h4 {
  color: #303133;
  margin: 15px 0 10px 0;
}

.binding-instructions ol,
.binding-instructions ul {
  margin: 10px 0;
  padding-left: 20px;
}

.binding-instructions li {
  margin: 5px 0;
  color: #606266;
}

.face-upload {
  text-align: center;
}

.upload-actions {
  text-align: center;
  margin: 20px 0;
}

.upload-actions .el-button {
  margin: 0 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .child-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .child-class {
    flex: none;
  }
  
  .upload-actions .el-button {
    margin: 5px;
    width: 100%;
  }
}
</style> 