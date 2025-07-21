<template>
  <div class="photo-albums-container">
    <div class="page-header">
      <h1>孩子照片</h1>
      <p>按孩子和时间归纳的照片集合</p>
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
        
        <div class="display-controls">
          <el-switch
            v-model="showEmptyPeriods"
            active-text="显示空时间段"
            inactive-text="隐藏空时间段"
          />
        </div>
      </div>
    </el-card>
    
    <!-- 相册列表 -->
    <div v-loading="loading" class="albums-container">
      <div v-if="albums.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无照片集">
          <el-button type="primary" @click="$router.push('/parent/public')">
            查看班级照片墙
          </el-button>
        </el-empty>
      </div>
      
      <div v-else>
        <div v-for="album in albums" :key="album.child.id" class="child-album">
          <div class="child-header">
            <div class="child-info">
              <el-avatar :size="40" class="child-avatar">
                {{ album.child.name.charAt(0) }}
              </el-avatar>
              <div class="child-details">
                <h3 class="child-name">{{ album.child.name }}</h3>
                <p class="child-class">{{ album.child.class_name }}</p>
                <p class="child-stats">共 {{ album.totalPhotos }} 张照片</p>
              </div>
            </div>
            
            <div class="child-actions">
              <el-button 
                :type="expandedChildren.includes(album.child.id) ? 'primary' : 'default'"
                @click="toggleChild(album.child.id)"
              >
                <el-icon>
                  <component :is="expandedChildren.includes(album.child.id) ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
                {{ expandedChildren.includes(album.child.id) ? '收起' : '展开' }}
              </el-button>
            </div>
          </div>
          
          <el-collapse-transition>
            <div v-show="expandedChildren.includes(album.child.id)" class="time-groups">
              <div v-if="album.timeGroups.length === 0" class="empty-time-groups">
                <el-empty description="该孩子暂无照片" />
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
                          </div>
                          
                          <div class="photo-actions">
                            <el-button 
                              size="small"
                              :type="photo.liked ? 'danger' : 'info'"
                              :icon="photo.liked ? 'StarFilled' : 'Star'"
                              @click.stop="toggleLike(photo)"
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
      :title="`照片预览 - ${previewPhoto.child?.name || ''}`"
      width="90%"
      center
      append-to-body
    >
      <div class="preview-container">
        <div class="preview-image-wrapper">
          <el-image 
            v-if="currentPreviewPhoto"
            :src="getImageUrl(currentPreviewPhoto.path)" 
            fit="contain"
            class="preview-image"
          />
        </div>
        
        <div class="preview-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">拍摄时间：</span>
              <span class="value">{{ formatDate(currentPreviewPhoto?.created_at) }}</span>
            </div>
            <div class="info-item" v-if="currentPreviewPhoto?.activity">
              <span class="label">活动场景：</span>
              <span class="value">{{ currentPreviewPhoto.activity }}</span>
            </div>
            <div class="info-item">
              <span class="label">上传者：</span>
              <span class="value">{{ currentPreviewPhoto?.uploader_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">点赞数：</span>
              <span class="value">{{ currentPreviewPhoto?.like_count || 0 }}</span>
            </div>
          </div>
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
          <el-button 
            :type="currentPreviewPhoto?.liked ? 'danger' : 'primary'"
            @click="toggleLike(currentPreviewPhoto)"
          >
            <el-icon>
              <component :is="currentPreviewPhoto?.liked ? 'StarFilled' : 'Star'" />
            </el-icon>
            {{ currentPreviewPhoto?.liked ? '取消点赞' : '点赞' }}
          </el-button>
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
  Star,
  StarFilled
} from '@element-plus/icons-vue';
import axios from 'axios';

export default {
  name: 'PhotoAlbums',
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
    Star,
    StarFilled
  },
  setup() {
    const loading = ref(false);
    const albums = ref([]);
    const groupBy = ref('month');
    const showEmptyPeriods = ref(false);
    const expandedChildren = ref([]);
    const expandedPeriods = ref([]);
    
    // 照片预览相关
    const showPreviewDialog = ref(false);
    const currentPreviewPhoto = ref(null);
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
        const response = await axios.get('/photos/albums', {
          params: {
            groupBy: groupBy.value
          }
        });
        
        albums.value = response.data.albums;
        
        // 默认展开所有孩子
        expandedChildren.value = albums.value.map(album => album.child.id);
        
        console.log('加载的相册数据:', albums.value);
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
    
    const toggleChild = (childId) => {
      const index = expandedChildren.value.indexOf(childId);
      if (index > -1) {
        expandedChildren.value.splice(index, 1);
      } else {
        expandedChildren.value.push(childId);
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
    
    const toggleLike = async (photo) => {
      try {
        const response = await axios.post('/photos/like', {
          photoId: photo.id
        });
        
        // 更新本地状态
        photo.liked = response.data.liked;
        photo.like_count = response.data.liked ? 
          (photo.like_count || 0) + 1 : 
          Math.max((photo.like_count || 1) - 1, 0);
        
        ElMessage.success(photo.liked ? '点赞成功' : '取消点赞');
      } catch (error) {
        console.error('点赞操作失败:', error);
        ElMessage.error('操作失败');
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
      showEmptyPeriods,
      expandedChildren,
      expandedPeriods,
      showPreviewDialog,
      currentPreviewPhoto,
      previewPhotos,
      currentPreviewIndex,
      formatDate,
      getImageUrl,
      handleImageError,
      changeGroupBy,
      toggleChild,
      togglePeriod,
      previewPhoto,
      prevPreviewPhoto,
      nextPreviewPhoto,
      toggleLike
    };
  }
};
</script>

<style scoped>
.photo-albums-container {
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

.child-album {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.child-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.child-avatar {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: bold;
}

.child-details h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.child-details p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.child-stats {
  font-weight: 500;
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

.photo-activity {
  font-size: 12px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #E6A23C;
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

.empty-state {
  text-align: center;
  padding: 40px;
}

.empty-time-groups {
  text-align: center;
  padding: 20px;
}

/* 预览对话框样式 */
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 60vh;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

.preview-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
}

.value {
  color: #303133;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .child-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .child-info {
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
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-navigation {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 