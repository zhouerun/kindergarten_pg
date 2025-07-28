<template>
  <div class="photo-management-container">
    <div class="page-header">
      <h1>照片管理</h1>
      <p>管理您已上传的班级照片</p>
    </div>
    
    <!-- 控制栏 -->
    <el-card style="margin-bottom: 20px;">
      <div class="controls">
        <div class="view-controls">
          <el-button-group>
            <el-button 
              :type="groupBy === 'month' ? 'primary' : 'default'"
              @click="changeGroupBy('month')"
            >
              <el-icon><Calendar /></el-icon>
              按月分组
            </el-button>
            <el-button 
              :type="groupBy === 'week' ? 'primary' : 'default'"
              @click="changeGroupBy('week')"
            >
              <el-icon><Clock /></el-icon>
              按周分组
            </el-button>
            <el-button 
              :type="groupBy === 'day' ? 'primary' : 'default'"
              @click="changeGroupBy('day')"
            >
              <el-icon><Sunrise /></el-icon>
              按日分组
            </el-button>
          </el-button-group>
        </div>
        
        <div class="action-controls">
          <el-button type="primary" @click="$router.push('/teacher/upload')">
            <el-icon><Plus /></el-icon>
            上传新照片
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 照片集列表 -->
    <div v-loading="loading" class="albums-container">
      <div v-if="albums.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无照片">
          <el-button type="primary" @click="$router.push('/teacher/upload')">
            立即上传照片
          </el-button>
        </el-empty>
      </div>
      
      <div v-else>
        <div v-for="album in albums" :key="album.class.id" class="class-album">
          <div class="class-header">
            <div class="class-info">
              <div class="class-avatar">
                <el-icon><School /></el-icon>
              </div>
              <div class="class-details">
                <h3 class="class-name">{{ album.class.name }}</h3>
                <p class="class-stats">{{ album.class.student_count }} 名学生 · {{ album.totalPhotos }} 张照片</p>
              </div>
            </div>
            
            <div class="class-actions">
              <el-button 
                :type="expandedClasses.includes(album.class.id) ? 'primary' : 'default'"
                @click="toggleClass(album.class.id)"
              >
                <el-icon>
                  <component :is="expandedClasses.includes(album.class.id) ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
                {{ expandedClasses.includes(album.class.id) ? '收起' : '展开' }}
              </el-button>
            </div>
          </div>
          
          <el-collapse-transition>
            <div v-show="expandedClasses.includes(album.class.id)" class="time-groups">
              <div v-if="album.timeGroups.length === 0" class="empty-time-groups">
                <el-empty description="该班级暂无照片">
                  <el-button type="primary" @click="$router.push('/teacher/upload')">
                    为该班级上传照片
                  </el-button>
                </el-empty>
              </div>
              
              <div v-else>
                <div 
                  v-for="timeGroup in album.timeGroups" 
                  :key="timeGroup.period"
                  class="time-group"
                >
                  <div class="time-header">
                    <div class="time-info">
                      <el-icon><Calendar /></el-icon>
                      <span class="time-period">{{ timeGroup.formattedPeriod }}</span>
                      <el-tag size="small" type="info">{{ timeGroup.photoCount }} 张</el-tag>
                    </div>
                    
                    <div class="time-actions">
                      <el-button 
                        size="small"
                        :type="expandedPeriods.includes(timeGroup.period) ? 'primary' : 'default'"
                        @click="togglePeriod(timeGroup.period)"
                      >
                        <el-icon>
                          <component :is="expandedPeriods.includes(timeGroup.period) ? 'ArrowUp' : 'ArrowDown'" />
                        </el-icon>
                        {{ expandedPeriods.includes(timeGroup.period) ? '收起' : '查看' }}
                      </el-button>
                    </div>
                  </div>
                  
                  <el-collapse-transition>
                    <div v-show="expandedPeriods.includes(timeGroup.period)" class="photos-grid">
                      <div 
                        v-for="photo in timeGroup.photos" 
                        :key="photo.id"
                        class="photo-item"
                        @click="previewPhoto(photo, timeGroup.photos)"
                      >
                        <img 
                          :src="getImageUrl(photo.path)" 
                          class="photo-image"
                          alt="照片"
                          @error="handleImageError"
                        />
                        
                        <div class="photo-overlay">
                          <div class="photo-info">
                            <p class="photo-date">{{ formatDate(photo.created_at) }}</p>
                            <p class="photo-activity" v-if="photo.activity">
                              <el-icon><Location /></el-icon>
                              {{ photo.activity }}
                            </p>
                            <p class="photo-children" v-if="photo.children && photo.children.length > 0">
                              <el-icon><User /></el-icon>
                              {{ photo.children.map(c => c.name).join(', ') }}
                            </p>
                            <p class="photo-visibility">
                              <el-icon v-if="photo.is_public"><View /></el-icon>
                              <el-icon v-else><Hide /></el-icon>
                              {{ photo.is_public ? '公开' : '私密' }}
                            </p>
                          </div>
                          
                          <div class="photo-actions">
                            <el-button 
                              size="small"
                              type="info"
                              :icon="'Star'"
                            >
                              {{ photo.like_count || 0 }}
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-collapse-transition>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>
    </div>
    
    <!-- 照片预览对话框 -->
    <el-dialog 
      v-model="showPreviewDialog" 
      :title="`照片预览 - ${currentPreviewClass || ''}`"
      width="90%"
      center
      append-to-body
    >
      <div class="preview-container">
        <div class="preview-image-wrapper">
          <img 
            v-if="currentPreviewPhoto"
            :src="getImageUrl(currentPreviewPhoto.path)" 
            class="preview-image"
            alt="预览图片"
            @error="handleImageError"
          />
        </div>
        
        <div class="preview-navigation" v-if="previewPhotos.length > 1">
          <el-button 
            @click="prevPreviewPhoto" 
            :disabled="currentPreviewIndex === 0"
            type="primary"
          >
            <el-icon><ArrowLeft /></el-icon>
            上一张
          </el-button>
          
          <span class="nav-info">
            {{ currentPreviewIndex + 1 }} / {{ previewPhotos.length }}
          </span>
          
          <el-button 
            @click="nextPreviewPhoto" 
            :disabled="currentPreviewIndex === previewPhotos.length - 1"
            type="primary"
          >
            下一张
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPreviewDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Calendar, 
  Clock, 
  Sunrise, 
  Picture, 
  Location, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  School,
  User,
  Plus,
  View,
  Hide
} from '@element-plus/icons-vue';
import api from '@/utils/axios';

export default {
  name: 'PhotoManagement',
  components: {
    Calendar,
    Clock,
    Sunrise,
    Picture,
    Location,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    School,
    User,
    Plus,
    View,
    Hide
  },
  setup() {
    const loading = ref(false);
    const albums = ref([]);
    const groupBy = ref('month');
    const expandedClasses = ref([]);
    const expandedPeriods = ref([]);
    
    // 照片预览相关
    const showPreviewDialog = ref(false);
    const currentPreviewPhoto = ref(null);
    const currentPreviewClass = ref('');
    const previewPhotos = ref([]);
    const currentPreviewIndex = ref(0);
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    };
    
    // 生成正确的图片URL（直接使用OSS完整路径）
    const getImageUrl = (photoPath) => {
      if (!photoPath) return '';
      // 如果已经是完整的URL，直接返回
      if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
      }
      // 如果是相对路径，转换为OSS完整路径
      return photoPath;
    };
    
    const loadAlbums = async () => {
      loading.value = true;
      try {
        const response = await api.get('/photos/teacher-albums', {
          params: {
            groupBy: groupBy.value
          }
        });
        
        albums.value = response.data.albums;
        
        // 默认展开所有班级
        expandedClasses.value = albums.value.map(album => album.class.id);
        
        console.log('加载的教师相册数据:', albums.value);
      } catch (error) {
        console.error('加载相册失败:', error);
        ElMessage.error('加载照片集失败');
      } finally {
        loading.value = false;
      }
    };
    
    const changeGroupBy = (newGroupBy) => {
      if (groupBy.value !== newGroupBy) {
        groupBy.value = newGroupBy;
        expandedPeriods.value = []; // 重置展开状态
        loadAlbums();
      }
    };
    
    const toggleClass = (classId) => {
      const index = expandedClasses.value.indexOf(classId);
      if (index > -1) {
        expandedClasses.value.splice(index, 1);
      } else {
        expandedClasses.value.push(classId);
      }
    };
    
    const togglePeriod = (period) => {
      const index = expandedPeriods.value.indexOf(period);
      if (index > -1) {
        expandedPeriods.value.splice(index, 1);
      } else {
        expandedPeriods.value.push(period);
      }
    };
    
    const previewPhoto = (photo, photos) => {
      currentPreviewPhoto.value = photo;
      previewPhotos.value = photos;
      currentPreviewIndex.value = photos.findIndex(p => p.id === photo.id);
      
      // 找到当前照片所属的班级名称
      for (const album of albums.value) {
        for (const timeGroup of album.timeGroups) {
          if (timeGroup.photos.some(p => p.id === photo.id)) {
            currentPreviewClass.value = album.class.name;
            break;
          }
        }
        if (currentPreviewClass.value) break;
      }
      
      showPreviewDialog.value = true;
    };
    
    const prevPreviewPhoto = () => {
      if (currentPreviewIndex.value > 0) {
        currentPreviewIndex.value--;
        currentPreviewPhoto.value = previewPhotos.value[currentPreviewIndex.value];
      }
    };
    
    const nextPreviewPhoto = () => {
      if (currentPreviewIndex.value < previewPhotos.value.length - 1) {
        currentPreviewIndex.value++;
        currentPreviewPhoto.value = previewPhotos.value[currentPreviewIndex.value];
      }
    };
    
    // 处理图片加载错误
    const handleImageError = (error) => {
      console.error('图片加载失败:', error);
      // 可以在这里添加重试逻辑或显示默认图片
    };
    
    onMounted(() => {
      loadAlbums();
    });
    
    return {
      loading,
      albums,
      groupBy,
      expandedClasses,
      expandedPeriods,
      showPreviewDialog,
      currentPreviewPhoto,
      currentPreviewClass,
      previewPhotos,
      currentPreviewIndex,
      formatDate,
      getImageUrl,
      handleImageError,
      changeGroupBy,
      toggleClass,
      togglePeriod,
      previewPhoto,
      prevPreviewPhoto,
      nextPreviewPhoto
    };
  }
};
</script>

<style scoped>
.photo-management-container {
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

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.class-album {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
}

.class-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.class-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.class-details h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.class-details p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.time-groups {
  padding: 20px;
  background: #f8f9fa;
}

.time-group {
  background: white;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.time-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f1f3f4;
  border-radius: 8px 8px 0 0;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-period {
  font-weight: 500;
  color: #303133;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  padding: 20px;
}

.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.photo-item:hover {
  transform: translateY(-2px);
}

.photo-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  color: white;
  padding: 10px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.photo-item:hover .photo-overlay {
  transform: translateY(0);
}

.photo-info {
  margin-bottom: 8px;
}

.photo-date {
  font-size: 12px;
  margin: 0 0 4px 0;
}

.photo-activity, .photo-children, .photo-visibility {
  font-size: 11px;
  margin: 0 0 2px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.photo-activity {
  color: #E6A23C;
}

.photo-children {
  color: #67c23a;
}

.photo-visibility {
  color: #909399;
}

.photo-actions {
  display: flex;
  justify-content: flex-end;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 24px;
}

.empty-state, .empty-time-groups {
  text-align: center;
  padding: 40px;
}

/* 预览对话框样式 */
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* height: 80vh; */
}

.preview-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80%;
}

.preview-image {
  max-width: 100%;
  height: 60vh;
  border-radius: 8px;
  object-fit: contain;
}

.preview-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.nav-info {
  font-size: 14px;
  color: #606266;
  padding: 0 15px;
}

.dialog-footer {
  text-align: center;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .class-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .class-info {
    flex-direction: column;
    text-align: center;
  }
  
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .photo-image {
    height: 120px;
  }
  
  .time-header {
    flex-direction: column;
    gap: 10px;
  }
  

  
  .preview-navigation {
    flex-direction: row;
    gap: 10px;
  }
}
</style> 