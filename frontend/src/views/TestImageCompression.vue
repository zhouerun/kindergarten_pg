<template>
  <div class="test-compression-container">
    <h1>图片压缩功能测试</h1>
    
    <el-card>
      <el-upload
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :before-upload="beforeUpload"
        multiple
        accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp"
        :show-file-list="true"
      >
        <el-icon class="el-icon--upload"><Plus /></el-icon>
        <div class="el-upload__text">
          将文件拖拽到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 JPG、JPEG、PNG、BMP、TIFF、WEBP 格式，最大50MB，大于3MB的图片将自动压缩
          </div>
        </template>
      </el-upload>
    </el-card>
    
    <!-- 文件列表 -->
    <el-card v-if="fileList.length > 0" style="margin-top: 20px;">
      <template #header>
        <span>文件列表</span>
      </template>
      
      <el-table :data="fileList" style="width: 100%">
        <el-table-column prop="name" label="文件名" width="200" />
        <el-table-column label="原始大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.originalSize) }}
          </template>
        </el-table-column>
        <el-table-column label="压缩后大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column label="压缩比例" width="120">
          <template #default="scope">
            <span :style="{ color: scope.row.compressionRatio > 50 ? '#67c23a' : '#e6a23c' }">
              {{ scope.row.compressionRatio.toFixed(1) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'compressed' ? 'success' : 'info'">
              {{ scope.row.status === 'compressed' ? '已压缩' : '无需压缩' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { compressImage, formatFileSize } from '@/utils/imageCompression';

export default {
  name: 'TestImageCompression',
  components: {
    Plus
  },
  setup() {
    const fileList = ref([]);
    
    const beforeUpload = async (file) => {
      console.log('原始文件:', file);
      
      // 允许的图片类型（MIME类型）
      const allowedTypes = [
        'image/jpeg',    // .jpg, .jpeg
        'image/png',     // .png
        'image/bmp',     // .bmp
        'image/tiff',    // .tiff
        'image/webp'     // .webp
      ];
      
      const isValidImage = allowedTypes.includes(file.type);
      const fileSizeMB = file.size / 1024 / 1024;
      const maxOriginalSizeMB = 50; // 最大支持50MB
      
      if (!isValidImage) {
        ElMessage.error('只能上传 JPG、JPEG、PNG、BMP、TIFF、WEBP 格式的图片!');
        return false;
      }
      
      if (fileSizeMB > maxOriginalSizeMB) {
        ElMessage.error(`上传图片大小不能超过 ${maxOriginalSizeMB}MB!`);
        return false;
      }
      
      // 记录原始大小
      const originalSize = file.size;
      let status = 'original';
      let compressionRatio = 0;
      
      // 如果文件大于3MB，进行压缩
      if (fileSizeMB > 3) {
        try {
          ElMessage.info(`正在压缩图片: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
          const compressedFile = await compressImage(file, 3, maxOriginalSizeMB);
          
          // 替换原文件
          file.raw = compressedFile;
          file.size = compressedFile.size;
          
          const compressedSizeMB = compressedFile.size / 1024 / 1024;
          compressionRatio = ((originalSize - compressedFile.size) / originalSize) * 100;
          status = 'compressed';
          
          ElMessage.success(`图片压缩完成: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`);
          
          console.log('压缩后的文件:', compressedFile);
        } catch (error) {
          console.error('图片压缩失败:', error);
          ElMessage.warning(`图片压缩失败，将使用原文件: ${error.message}`);
        }
      }
      
      // 添加到文件列表
      fileList.value.push({
        name: file.name,
        originalSize: originalSize,
        size: file.size,
        compressionRatio: compressionRatio,
        status: status,
        file: file
      });
      
      return false; // 阻止自动上传
    };
    
    const handleFileChange = (file, newFileList) => {
      console.log('文件变化:', file, newFileList);
    };
    
    return {
      fileList,
      beforeUpload,
      handleFileChange,
      formatFileSize
    };
  }
};
</script>

<style scoped>
.test-compression-container {
  padding: 20px;
}

.test-compression-container h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}
</style> 