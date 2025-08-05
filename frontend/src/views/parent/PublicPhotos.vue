<template>
  <div class="public-photos-container">
    <div class="page-header">
      <h1>班级照片墙</h1>
      <p>浏览班级的公开照片</p>
    </div>
    
    <!-- 控制栏 -->
    <el-card style="margin-bottom: 20px;">
      <div class="controls">
        <div class="group-controls">
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
      </div>
    </el-card>
    
    <!-- 集合视图 -->
    <div v-loading="albumsLoading" class="albums-container">
      <div v-if="albums.length === 0 && !albumsLoading" class="empty-state">
        <el-empty description="暂无照片集" />
      </div>
      
      <div v-else>
        <div 
          v-for="album in albums" 
          :key="album.class.id"
          class="class-album"
        >
          <div class="class-header" :class="{ 'parent-class': album.class.isParentClass }">
            <div class="class-info">
              <div class="class-title">
                <h3>{{ album.class.name }}</h3>
                <el-tag size="small" type="info">{{ album.class.student_count }} 人</el-tag>
              </div>
              <div class="class-stats">
                <el-tag size="small">共 {{ album.totalPhotos }} 张照片</el-tag>
              </div>
            </div>
            
            <div class="class-actions">
              <el-button 
                size="small"
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
            <div v-show="expandedClasses.includes(album.class.id)" class="activity-groups">
              <div v-if="album.activityGroups.length === 0" class="empty-activity-groups">
                <el-empty description="该班级暂无公共照片" />
              </div>
              
              <div v-else>
                <div 
                  v-for="activityGroup in album.activityGroups" 
                  :key="activityGroup.activity"
                  class="activity-group"
                >
                  <div class="activity-header">
                    <div class="activity-info">
                      <el-icon><Location /></el-icon>
                      <span class="activity-name">{{ activityGroup.activity }}</span>
                      <el-tag size="small" type="success">{{ activityGroup.totalPhotos }} 张</el-tag>
                    </div>
                    
                    <div class="activity-actions">
                      <el-button 
                        size="small"
                        :type="expandedActivities.includes(activityGroup.activity) ? 'primary' : 'default'"
                        @click="toggleActivity(activityGroup.activity)"
                      >
                        <el-icon>
                          <component :is="expandedActivities.includes(activityGroup.activity) ? 'ArrowUp' : 'ArrowDown'" />
                        </el-icon>
                        {{ expandedActivities.includes(activityGroup.activity) ? '收起' : '查看' }}
                      </el-button>
                    </div>
                  </div>
                  
                  <el-collapse-transition>
                    <div v-show="expandedActivities.includes(activityGroup.activity)" class="time-groups">
                      <div 
                        v-for="timeGroup in activityGroup.timeGroups" 
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
                              @click="openFullscreenPhoto(photo, timeGroup.photos)"
                            >
                              <img 
                                :src="getImageUrl(photo.path)" 
                                class="photo-image"
                                alt="照片"
                                @error="handleImageError"
                              />
                              
                              <div class="photo-overlay">
                                <div class="photo-actions">
                                  <el-button 
                                    type="primary" 
                                    size="small" 
                                    :icon="photo.liked ? 'StarFilled' : 'Star'"
                                    @click.stop="toggleLike(photo)"
                                  >
                                    {{ photo.like_count || 0 }}
                                  </el-button>
                                </div>
                                
                                <div class="photo-info">
                                  <p class="photo-date">{{ formatDate(photo.created_at) }}</p>
                                  <p class="photo-children" v-if="photo.children && photo.children.length > 0">
                                    <el-icon><User /></el-icon>
                                    {{ getChildrenNames(photo) }}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </el-collapse-transition>
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
    

    
    <!-- 全屏图片展示页面 -->
    <div v-if="showFullscreenView" class="fullscreen-view" @click="closeFullscreen">
      <div class="fullscreen-container" @click.stop>
        <img 
          v-if="currentPreviewPhoto"
          :src="getImageUrl(currentPreviewPhoto.path)" 
          class="fullscreen-image"
          alt="全屏图片"
          @error="handleImageError"
        />
        
        <!-- 点赞按钮 -->
        <div class="fullscreen-like-button">
          <el-button 
            :type="currentPreviewPhoto && currentPreviewPhoto.liked ? 'danger' : 'primary'"
            @click="toggleLike(currentPreviewPhoto)"
            circle
            size="large"
          >
            <el-icon>
              <component :is="currentPreviewPhoto && currentPreviewPhoto.liked ? 'StarFilled' : 'Star'" />
            </el-icon>
          </el-button>
        </div>
        
        <!-- 关闭按钮 -->
        <div class="fullscreen-close-button">
          <el-button @click="closeFullscreen" circle size="large">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Location, Calendar, Clock, Sunrise, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star, StarFilled, Close } from '@element-plus/icons-vue';
import api from '@/utils/axios';

export default {
  name: 'PublicPhotos',
  components: {
    User, Location, Calendar, Clock, Sunrise, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star, StarFilled, Close
  },
  setup() {
    // 集合视图相关变量
    const albumsLoading = ref(false);
    const albums = ref([]);
    const groupBy = ref('month');
    const expandedClasses = ref([]);
    const expandedActivities = ref([]);
    const expandedPeriods = ref([]);
    
    // 孩子信息（用于显示识别到的孩子姓名）
    const children = ref([]);
    
    // 照片预览相关变量
    const currentPreviewPhoto = ref(null);
    const previewPhotos = ref([]);
    const currentPreviewIndex = ref(0);
    const showFullscreenView = ref(false); // 控制全屏预览

    
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
    
    const getChildrenNames = (photo) => {
      if (!photo || !photo.children || !Array.isArray(photo.children)) return '';
      
      const childNames = photo.children.map(child => child.name).filter(name => name);
      
      return childNames.join(', ');
    };
    
    const toggleLike = async (photo) => {
      try {
        await api.post('/photos/like', {
          photoId: photo.id
        });
        
        // 更新本地状态
        photo.liked = !photo.liked;
        photo.like_count = photo.liked ? 
          (photo.like_count || 0) + 1 : 
          (photo.like_count || 1) - 1;
        
        ElMessage.success(photo.liked ? '点赞成功' : '取消点赞');
      } catch (error) {
        ElMessage.error('操作失败');
      }
    };
    
    // 处理图片加载错误
    const handleImageError = (error) => {
      console.error('图片加载失败:', error);
      // 可以在这里添加重试逻辑或显示默认图片
    };
    


    // 全屏预览照片
    const openFullscreenPhoto = (photo, allPhotos) => {
      currentPreviewPhoto.value = photo;
      previewPhotos.value = allPhotos;
      currentPreviewIndex.value = allPhotos.findIndex(p => p.id === photo.id);
      showFullscreenView.value = true;
      
      // 设置导航栏z-index为1
      setNavbarZIndex(1);
      
      // 添加全屏预览的触摸滑动支持
      nextTick(() => {
        addTouchSupport('.fullscreen-container', () => showFullscreenView.value, true);
      });
    };

    const openFullscreen = () => {
      showFullscreenView.value = true;
    };

    const closeFullscreen = () => {
      showFullscreenView.value = false;
      
      // 恢复导航栏z-index为1000
      setNavbarZIndex(1000);
    };
    
    // 设置导航栏z-index的函数
    const setNavbarZIndex = (zIndex) => {
      const navbar = document.querySelector('.mobile-bottom-nav');
      if (navbar) {
        navbar.style.zIndex = zIndex;
      }
    };

    // 通用的触摸滑动支持函数
    const addTouchSupport = (containerSelector, watchTarget, preventVerticalScroll = false) => {
      const container = document.querySelector(containerSelector);
      if (!container) return;
      
      let startX = 0;
      let startY = 0;
      let endX = 0;
      let endY = 0;
      
      const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      };
      
      const handleTouchEnd = (e) => {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
        
        const diffX = startX - endX;
        const diffY = startY - endY;
        
        // 确保是水平滑动且滑动距离足够
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
          if (diffX > 0) {
            // 向左滑动，显示下一张
            nextPreviewPhoto();
          } else {
            // 向右滑动，显示上一张
            prevPreviewPhoto();
          }
        }
      };
      
      const handleTouchMove = (e) => {
        // 如果需要禁用上下滑动
        if (preventVerticalScroll) {
          e.preventDefault();
        }
      };
      
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);
      if (preventVerticalScroll) {
        container.addEventListener('touchmove', handleTouchMove);
      }
      
      // 清理函数
      const cleanup = () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
        if (preventVerticalScroll) {
          container.removeEventListener('touchmove', handleTouchMove);
        }
      };
      
      // 在目标状态改变时清理事件监听器
      watch(watchTarget, (newVal) => {
        if (!newVal) {
          cleanup();
        }
      });
    };

    // 上一张照片
    const prevPreviewPhoto = () => {
      if (currentPreviewIndex.value > 0) {
        currentPreviewIndex.value--;
        currentPreviewPhoto.value = previewPhotos.value[currentPreviewIndex.value];
      }
    };

    // 下一张照片
    const nextPreviewPhoto = () => {
      if (currentPreviewIndex.value < previewPhotos.value.length - 1) {
        currentPreviewIndex.value++;
        currentPreviewPhoto.value = previewPhotos.value[currentPreviewIndex.value];
      }
    };
    
    // 加载孩子信息
    const loadChildren = async () => {
      try {
        const response = await api.get('/classes/students');
        children.value = response.data;
      } catch (error) {
        console.error('加载学生列表失败');
      }
    };
    
    // 集合视图相关函数
    const loadAlbums = async () => {
      albumsLoading.value = true;
      try {
        const response = await api.get('/photos/public-albums', {
          params: {
            groupBy: groupBy.value
          }
        });
        
        albums.value = response.data.albums;
        
        // 默认展开所有班级
        expandedClasses.value = albums.value.map(album => album.class.id);
        
        // 默认展开所有活动
        const allActivities = [];
        albums.value.forEach(album => {
          album.activityGroups.forEach(activityGroup => {
            if (!allActivities.includes(activityGroup.activity)) {
              allActivities.push(activityGroup.activity);
            }
          });
        });
        expandedActivities.value = allActivities;
        
        // 默认展开所有时间段
        const allPeriods = [];
        albums.value.forEach(album => {
          album.activityGroups.forEach(activityGroup => {
            activityGroup.timeGroups.forEach(timeGroup => {
              if (!allPeriods.includes(timeGroup.period)) {
                allPeriods.push(timeGroup.period);
              }
            });
          });
        });
        expandedPeriods.value = allPeriods;
        
        console.log('加载的公共照片集数据:', albums.value);
      } catch (error) {
        console.error('加载公共照片集失败:', error);
        ElMessage.error('加载照片集失败');
      } finally {
        albumsLoading.value = false;
      }
    };
    

    
    const changeGroupBy = (newGroupBy) => {
      groupBy.value = newGroupBy;
      loadAlbums();
    };
    
    const toggleClass = (classId) => {
      const index = expandedClasses.value.indexOf(classId);
      if (index > -1) {
        expandedClasses.value.splice(index, 1);
      } else {
        expandedClasses.value.push(classId);
      }
    };
    
    const toggleActivity = (activity) => {
      const index = expandedActivities.value.indexOf(activity);
      if (index > -1) {
        expandedActivities.value.splice(index, 1);
      } else {
        expandedActivities.value.push(activity);
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
    
    onMounted(() => {
      loadAlbums();
      loadChildren();
    });
    
    return {
      // 集合视图相关
      albumsLoading,
      albums,
      groupBy,
      expandedClasses,
      expandedActivities,
      expandedPeriods,
      children,
      // 照片预览相关
      currentPreviewPhoto,
      previewPhotos,
      currentPreviewIndex,
      showFullscreenView,
      // 函数
      formatDate,
      getImageUrl,
      handleImageError,
      openFullscreenPhoto,
      openFullscreen,
      closeFullscreen,
      setNavbarZIndex,
      getChildrenNames,
      toggleLike,
      loadAlbums,
      changeGroupBy,
      toggleClass,
      toggleActivity,
      togglePeriod,
      prevPreviewPhoto,
      nextPreviewPhoto,
      addTouchSupport
    };
  }
};
</script>

<style scoped>
.public-photos-container {
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





/* 控制栏样式 */
.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  /* margin-bottom: 15px; */
}

.group-controls {
  display: flex;
  gap: 10px;
}

/* 集合视图样式 */
.albums-container {
  padding: 20px 0;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.class-album {
  position: relative;
  margin-bottom: 30px;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  /* box-shadow: 0 4px 12px rgba(209, 209, 209, 0.3); */
  
}

/* .class-album::before {
  content: '';
  position: absolute;
  top: 0;
  left: -3px;
  width: 2px;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(135deg, #9ea9da 0%, #b18bd6 100%, #9ea8d4 100%);
  z-index: 100;
} */

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #57B9FF 0%, #77B1D4 100%);
  color: white;
  position: relative;
}

/* .class-header.parent-class {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
} */

.class-info {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.class-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.class-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.class-stats {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.class-actions {
  display: flex;
  gap: 10px;
}

.activity-groups {
  padding: 20px;
}

.empty-activity-groups {
  text-align: center;
  padding: 40px;
}

.activity-group {
  margin-bottom: 25px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f0f0f0;
  border-bottom: 1px solid #e4e7ed;
}

.activity-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.activity-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.activity-actions {
  display: flex;
  gap: 10px;
}

.time-groups {
  padding: 15px;
}

.time-group {
  margin-bottom: 20px;
}

.time-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-period {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.time-actions {
  display: flex;
  gap: 10px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.photo-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.photo-item:hover {
  transform: scale(1.05);
}

.photo-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  object-position: center;
  border-radius: 8px;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-actions {
  display: flex;
  justify-content: flex-end;
}

.photo-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.photo-info p {
  margin: 0;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.photo-date {
  color: #e4e7ed;
}

.photo-children {
  color: #67c23a;
}



/* 响应式设计 */
@media (max-width: 768px) {

  .public-photos-container {
    padding: 0px;
  }

  .activity-groups {
    padding: 5px;
  }

  .group-controls {
    padding: 2px;
  }
  .group-controls :deep(.el-button-group) {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: start;
    gap: 5px;
  }

  .group-controls :deep(.el-button) {
    border-radius: 10px;
  }
  
  .class-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
  
  .photo-image {
    height: 100px;
  }
}

/* 照片网格优化 */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

@media (max-width: 480px) {
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 6px;
    margin-top: 10px;
  }
  
  .photo-image {
    height: 80px;
  }
  
  .photo-overlay {
    padding: 5px;
  }
  
  .photo-info p {
    font-size: 10px;
  }
  
  .photo-actions .el-button {
    padding: 2px 6px;
    font-size: 10px;
  }
}

/* 全屏预览样式 */
.fullscreen-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  cursor: pointer;
  overflow: hidden;
  touch-action: pan-x; /* 只允许水平滑动 */
}

.fullscreen-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  overflow: hidden;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.fullscreen-like-button,
.fullscreen-close-button {
  position: absolute;
  top: 30px;
  z-index: 10;
}

.fullscreen-like-button {
  left: 30px;
}

.fullscreen-close-button {
  right: 30px;
}

.fullscreen-like-button .el-button,
.fullscreen-close-button .el-button {
  background: rgba(87, 185, 255, 0.8);
  border: 2px solid rgba(87, 185, 255, 0.9);
  color: white;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.fullscreen-like-button .el-button:hover,
.fullscreen-close-button .el-button:hover {
  background: rgba(87, 185, 255, 1);
  border-color: rgba(87, 185, 255, 1);
  transform: scale(1.1);
}

/* 手机端优化 */
@media (max-width: 768px) {
  .fullscreen-like-button,
  .fullscreen-close-button {
    top: 20px;
  }
  
  .fullscreen-like-button {
    left: 20px;
  }
  
  .fullscreen-close-button {
    right: 20px;
  }
}
</style> 