<template>
  <div class="photo-albums-container">
    <div class="page-header">
      <h1>孩子照片</h1>
      <p>按时间线查看孩子的成长记录</p>
    </div>
    
    <!-- 孩子切换控制栏 -->
    <el-card style="margin-bottom: 20px;">
      <div class="child-selector">
        <div class="child-tabs">
          <el-button-group>
            <el-button 
              v-for="album in albums" 
              :key="album.child.id"
              :type="selectedChildId === album.child.id ? 'primary' : 'default'"
              @click="selectChild(album.child.id)"
            >
              <el-avatar :size="24" class="child-avatar-small">
                {{ album.child.name.charAt(0) }}
              </el-avatar>
              {{ album.child.name }}
              <el-tag size="small" type="info" style="margin-left: 8px;">
                {{ album.totalPhotos }}
              </el-tag>
            </el-button>
          </el-button-group>
        </div>
        
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
          
          <el-button 
            type="success" 
            @click="generateReport"
            :disabled="!selectedChildAlbum || selectedChildAlbum.timeGroups.length === 0"
          >
            <el-icon><Document /></el-icon>
            生成{{ groupBy === 'week' ? '周报' : groupBy === 'month' ? '月报' : '日报' }}
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 时间线照片展示 -->
    <div v-loading="loading" class="timeline-container">
      <div v-if="albums.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无照片集">
          <el-button type="primary" @click="$router.push('/parent/public')">
            查看班级照片墙
          </el-button>
        </el-empty>
      </div>
      
      <div v-else-if="selectedChildId && selectedChildAlbum" class="timeline-view">
        <div v-if="selectedChildAlbum.timeGroups.length === 0" class="empty-timeline">
          <el-empty description="该孩子暂无照片" />
        </div>
        
        <div v-else class="timeline">
          <div 
            v-for="(timeGroup, index) in selectedChildAlbum.timeGroups" 
            :key="timeGroup.period"
            class="timeline-item"
          >
            <!-- 时间线标记 -->
            <div class="timeline-marker">
              <div class="marker-dot"></div>
              <div class="marker-line" v-if="index < selectedChildAlbum.timeGroups.length - 1"></div>
            </div>
            
            <!-- 时间组内容 -->
            <div class="timeline-content">
              <div class="time-header">
                <div class="time-info">
                  <el-icon><Calendar /></el-icon>
                  <span class="time-period">{{ timeGroup.formattedPeriod }}</span>
                  <el-tag size="small" type="info">{{ timeGroup.photoCount }} 张</el-tag>
                </div>
              </div>
              
              <div class="photos-grid">
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
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-child-selected">
        <el-empty description="请选择一个孩子查看照片">
          <el-button type="primary" @click="selectFirstChild">
            选择第一个孩子
          </el-button>
        </el-empty>
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
    
    <!-- 周/月报预览对话框 -->
    <el-dialog 
      v-model="showReportDialog" 
      :title="`${reportTitle} - ${selectedChildAlbum?.child?.name || ''}`"
      width="95%"
      center
      append-to-body
      class="report-dialog"
    >
      <div class="report-container" v-if="currentReport">
        <!-- 报告头部 -->
        <div class="report-header">
          <div class="report-title">
            <h1>{{ currentReport.title }}</h1>
            <p class="report-subtitle">{{ currentReport.subtitle }}</p>
          </div>
          <div class="report-stats">
            <div class="stat-item">
              <span class="stat-number">{{ currentReport.totalPhotos }}</span>
              <span class="stat-label">张照片</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ currentReport.timeGroups.length }}</span>
              <span class="stat-label">个时间段</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ currentReport.activities.length }}</span>
              <span class="stat-label">种活动</span>
            </div>
          </div>
        </div>
        
        <!-- 活动场景分析 -->
        <div class="report-section" v-if="currentReport.activities.length > 0">
          <h2 class="section-title">
            <el-icon><Location /></el-icon>
            活动场景分析
          </h2>
          <div class="activities-grid">
            <div 
              v-for="activity in currentReport.activities" 
              :key="activity.name"
              class="activity-card"
            >
              <div class="activity-icon">
                <el-icon><Picture /></el-icon>
              </div>
              <div class="activity-info">
                <h3>{{ activity.name }}</h3>
                <p>{{ activity.count }} 张照片</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 时间线回顾 -->
        <div class="report-section">
          <h2 class="section-title">
            <el-icon><Calendar /></el-icon>
            时间线回顾
          </h2>
          <div class="timeline-review">
            <div 
              v-for="(timeGroup, index) in currentReport.timeGroups" 
              :key="timeGroup.period"
              class="review-item"
            >
              <div class="review-marker">
                <div class="review-dot"></div>
                <div class="review-line" v-if="index < currentReport.timeGroups.length - 1"></div>
              </div>
              
              <div class="review-content">
                <div class="review-header">
                  <h3>{{ timeGroup.formattedPeriod }}</h3>
                  <span class="photo-count">{{ timeGroup.photoCount }} 张照片</span>
                </div>
                
                <div class="review-photos">
                  <div 
                    v-for="photo in timeGroup.photos.slice(0, 4)" 
                    :key="photo.id"
                    class="review-photo"
                    @click="previewPhoto(photo, timeGroup.photos)"
                  >
                    <img 
                      :src="getImageUrl(photo.path)" 
                      :alt="photo.activity || '照片'"
                    />
                    <div class="photo-overlay-mini">
                      <span v-if="photo.activity">{{ photo.activity }}</span>
                    </div>
                  </div>
                  <div 
                    v-if="timeGroup.photos.length > 4" 
                    class="more-photos"
                    @click="previewPhoto(timeGroup.photos[4], timeGroup.photos)"
                  >
                    <span>+{{ timeGroup.photos.length - 4 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 成长亮点 -->
        <div class="report-section">
          <h2 class="section-title">
            <el-icon><Star /></el-icon>
            成长亮点
          </h2>
          <div class="highlights">
            <div class="highlight-item">
              <div class="highlight-icon">📸</div>
              <div class="highlight-content">
                <h4>精彩瞬间</h4>
                <p>记录了 {{ currentReport.totalPhotos }} 个美好时刻</p>
              </div>
            </div>
            <div class="highlight-item">
              <div class="highlight-icon">🎯</div>
              <div class="highlight-content">
                <h4>活动丰富</h4>
                <p>参与了 {{ currentReport.activities.length }} 种不同的活动</p>
              </div>
            </div>
            <div class="highlight-item">
              <div class="highlight-icon">⏰</div>
              <div class="highlight-content">
                <h4>时间跨度</h4>
                <p>跨越了 {{ currentReport.timeGroups.length }} 个时间段</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showReportDialog = false">关闭</el-button>
          <el-button type="primary" @click="printReport">
            <el-icon><Printer /></el-icon>
            打印报告
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Calendar, 
  Clock, 
  Sunrise, 
  Picture, 
  Location, 
  ArrowLeft, 
  ArrowRight,
  Star,
  StarFilled,
  Document,
  Printer
} from '@element-plus/icons-vue';
import api from '@/utils/axios';

export default {
  name: 'PhotoAlbums',
  components: {
    Calendar,
    Clock,
    Sunrise,
    Picture,
    Location,
    ArrowLeft,
    ArrowRight,
    Star,
    StarFilled,
    Document,
    Printer
  },
  setup() {
    const loading = ref(false);
    const albums = ref([]);
    const groupBy = ref('month');
    const selectedChildId = ref(null);
    
    // 照片预览相关
    const showPreviewDialog = ref(false);
    const currentPreviewPhoto = ref(null);
    const previewPhotos = ref([]);
    const currentPreviewIndex = ref(0);
    
    // 周/月报相关
    const showReportDialog = ref(false);
    const currentReport = ref(null);
    
    // 计算报告标题
    const reportTitle = computed(() => {
      if (groupBy.value === 'week') return '周报';
      if (groupBy.value === 'month') return '月报';
      return '日报';
    });
    
    // 计算当前选中的孩子相册
    const selectedChildAlbum = computed(() => {
      return albums.value.find(album => album.child.id === selectedChildId.value);
    });
    
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
        const response = await api.get('/photos/albums', {
          params: {
            groupBy: groupBy.value
          }
        });
        
        albums.value = response.data.albums;
        
        // 默认选择第一个孩子
        if (albums.value.length > 0 && !selectedChildId.value) {
          selectedChildId.value = albums.value[0].child.id;
        }
        
        console.log('加载的相册数据:', albums.value);
      } catch (error) {
        console.error('加载相册失败:', error);
        ElMessage.error('加载照片集失败');
      } finally {
        loading.value = false;
      }
    };
    
    const selectChild = (childId) => {
      selectedChildId.value = childId;
    };
    
    const selectFirstChild = () => {
      if (albums.value.length > 0) {
        selectChild(albums.value[0].child.id);
      }
    };
    
    const changeGroupBy = (newGroupBy) => {
      if (groupBy.value !== newGroupBy) {
        groupBy.value = newGroupBy;
        loadAlbums();
      }
    };
    
    // 生成周/月报
    const generateReport = () => {
      if (!selectedChildAlbum.value) return;
      
      const album = selectedChildAlbum.value;
      const child = album.child;
      
      // 统计活动类型
      const activityMap = new Map();
      let totalPhotos = 0;
      
      album.timeGroups.forEach(timeGroup => {
        timeGroup.photos.forEach(photo => {
          totalPhotos++;
          if (photo.activity) {
            activityMap.set(photo.activity, (activityMap.get(photo.activity) || 0) + 1);
          }
        });
      });
      
      const activities = Array.from(activityMap.entries()).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count);
      
      // 生成报告标题
      const now = new Date();
      const title = `${child.name}的${reportTitle.value}`;
      const subtitle = `生成时间：${now.toLocaleDateString('zh-CN')}`;
      
      currentReport.value = {
        title,
        subtitle,
        totalPhotos,
        timeGroups: album.timeGroups,
        activities
      };
      
      showReportDialog.value = true;
    };
    
    // 打印报告
    const printReport = () => {
      window.print();
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
        const response = await api.post('/photos/like', {
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
      selectedChildId,
      selectedChildAlbum,
      showPreviewDialog,
      currentPreviewPhoto,
      previewPhotos,
      currentPreviewIndex,
      showReportDialog,
      currentReport,
      reportTitle,
      formatDate,
      getImageUrl,
      handleImageError,
      selectChild,
      selectFirstChild,
      changeGroupBy,
      generateReport,
      printReport,
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

.child-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.child-tabs {
  flex: 1;
}

.child-avatar-small {
  margin-right: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: bold;
}

.timeline-container {
  min-height: 400px;
}

.timeline-view {
  max-width: 1200px;
  margin: 0 auto;
}

.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline-item {
  position: relative;
  margin-bottom: 30px;
  display: flex;
}

.timeline-marker {
  position: absolute;
  left: -30px;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}

.marker-dot {
  width: 16px;
  height: 16px;
  background: #409EFF;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 3px #E4E7ED;
  z-index: 2;
}

.marker-line {
  width: 2px;
  height: 100%;
  background: #E4E7ED;
  margin-top: 8px;
  min-height: 30px;
}

.timeline-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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

.empty-state,
.empty-timeline,
.no-child-selected {
  text-align: center;
  padding: 40px;
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
  .child-selector {
    flex-direction: column;
    align-items: stretch;
  }
  
  .child-tabs {
    overflow-x: auto;
  }
  
  .timeline {
    padding-left: 20px;
  }
  
  .timeline-marker {
    left: -20px;
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

/* 周/月报样式 */
.report-dialog {
  .el-dialog__body {
    padding: 0;
  }
}

.report-container {
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 80vh;
}

.report-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.report-title h1 {
  color: #2c3e50;
  font-size: 2.5em;
  margin-bottom: 10px;
  font-weight: 700;
}

.report-subtitle {
  color: #7f8c8d;
  font-size: 1.1em;
  margin-bottom: 30px;
}

.report-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  min-width: 120px;
}

.stat-number {
  display: block;
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.9;
}

.report-section {
  background: white;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2c3e50;
  font-size: 1.5em;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ecf0f1;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.activity-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #3498db;
  transition: transform 0.2s ease;
}

.activity-card:hover {
  transform: translateY(-2px);
}

.activity-icon {
  width: 50px;
  height: 50px;
  background: #3498db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2em;
}

.activity-info h3 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.activity-info p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9em;
}

.timeline-review {
  position: relative;
  padding-left: 30px;
}

.review-item {
  position: relative;
  margin-bottom: 30px;
  display: flex;
}

.review-marker {
  position: absolute;
  left: -30px;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}

.review-dot {
  width: 16px;
  height: 16px;
  background: #e74c3c;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 3px #ecf0f1;
  z-index: 2;
}

.review-line {
  width: 2px;
  height: 100%;
  background: #ecf0f1;
  margin-top: 8px;
  min-height: 30px;
}

.review-content {
  flex: 1;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.review-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.photo-count {
  background: #3498db;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9em;
}

.review-photos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
}

.review-photo {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 1;
}

.review-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay-mini {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: 5px;
  font-size: 0.8em;
  text-align: center;
}

.more-photos {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecf0f1;
  border-radius: 8px;
  cursor: pointer;
  aspect-ratio: 1;
  font-weight: bold;
  color: #7f8c8d;
  transition: background-color 0.2s ease;
}

.more-photos:hover {
  background: #bdc3c7;
}

.highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border-radius: 12px;
}

.highlight-icon {
  font-size: 2em;
  width: 60px;
  text-align: center;
}

.highlight-content h4 {
  margin: 0 0 5px 0;
  font-size: 1.2em;
}

.highlight-content p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9em;
}

/* 打印样式 */
@media print {
  .report-container {
    background: white !important;
    padding: 20px !important;
  }
  
  .report-header,
  .report-section {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
  
  .activity-card,
  .highlight-item {
    break-inside: avoid;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .report-container {
    padding: 15px;
  }
  
  .report-title h1 {
    font-size: 1.8em;
  }
  
  .report-stats {
    gap: 20px;
  }
  
  .stat-item {
    min-width: 100px;
    padding: 15px;
  }
  
  .activities-grid {
    grid-template-columns: 1fr;
  }
  
  .timeline-review {
    padding-left: 20px;
  }
  
  .review-marker {
    left: -20px;
  }
  
  .review-photos {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }
  
  .highlights {
    grid-template-columns: 1fr;
  }
}
</style> 