<template>
  <div class="public-photos-container">
    <div class="page-header">
      <h1>班级照片墙</h1>
      <p>浏览班级的公共照片</p>
    </div>
    
    <!-- 筛选栏 -->
    <el-card style="margin-bottom: 20px;">
      <el-form :model="filterForm" :inline="true">
        <el-form-item label="班级">
          <el-select v-model="filterForm.classId" placeholder="选择班级" @change="loadPhotos">
            <el-option label="全部班级" :value="''" />
            <el-option 
              v-for="cls in classes" 
              :key="cls.id" 
              :label="cls.name" 
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="loadPhotos"
          />
        </el-form-item>
        
        <el-form-item>
          <el-input 
            v-model="filterForm.query" 
            placeholder="搜索照片..."
            style="width: 200px;"
            @keyup.enter="loadPhotos"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="loadPhotos">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 照片网格 -->
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>班级照片 ({{ total }})</span>
          <el-button-group>
            <el-button 
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
            >
              <el-icon><Grid /></el-icon>
              网格视图
            </el-button>
            <el-button 
              :type="viewMode === 'waterfall' ? 'primary' : 'default'"
              @click="viewMode = 'waterfall'"
            >
              <el-icon><Picture /></el-icon>
              瀑布流
            </el-button>
          </el-button-group>
        </div>
      </template>
      
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="photo-grid">
        <div 
          v-for="photo in photos" 
          :key="photo.id" 
          class="photo-card"
        >
          <el-image 
            :src="photo.path" 
            :preview-src-list="photos.map(p => p.path)"
            :initial-index="photos.findIndex(p => p.id === photo.id)"
            fit="cover"
            class="photo-image"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          
          <div class="photo-footer">
            <div class="photo-meta">
              <p class="photo-class">{{ photo.class_name }}</p>
              <p class="photo-date">{{ formatDate(photo.created_at) }}</p>
              <p class="photo-activity" v-if="photo.activity">
                <el-icon><Location /></el-icon>
                {{ photo.activity }}
              </p>
              <p class="photo-children" v-if="photo.recognition_data">
                <el-icon><User /></el-icon>
                {{ getChildrenNames(photo.recognition_data) }}
              </p>
            </div>
            
            <div class="photo-actions">
              <el-button 
                type="primary" 
                size="small" 
                :icon="photo.liked ? 'StarFilled' : 'Star'"
                @click="toggleLike(photo)"
              >
                {{ photo.like_count || 0 }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 瀑布流视图 -->
      <div v-else class="photo-waterfall">
        <div class="waterfall-column" v-for="column in waterfallColumns" :key="column.id">
          <div 
            v-for="photo in column.photos" 
            :key="photo.id" 
            class="waterfall-item"
          >
            <el-image 
              :src="photo.path" 
              :preview-src-list="photos.map(p => p.path)"
              :initial-index="photos.findIndex(p => p.id === photo.id)"
              fit="cover"
              class="waterfall-image"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            
            <div class="waterfall-overlay">
              <div class="overlay-content">
                <p class="photo-class">{{ photo.class_name }}</p>
                <p class="photo-date">{{ formatDate(photo.created_at) }}</p>
                <p class="photo-activity" v-if="photo.activity">
                  <el-icon><Location /></el-icon>
                  {{ photo.activity }}
                </p>
                <div class="overlay-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    :icon="photo.liked ? 'StarFilled' : 'Star'"
                    @click="toggleLike(photo)"
                  >
                    {{ photo.like_count || 0 }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <el-empty v-if="photos.length === 0 && !loading" description="暂无照片" />
    </el-card>
    
    <!-- 分页 -->
    <el-pagination
      v-if="total > 0"
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="handlePageChange"
      style="margin-top: 20px; text-align: center;"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Grid, Picture, User, Location } from '@element-plus/icons-vue';
import axios from 'axios';

export default {
  name: 'PublicPhotos',
  components: {
    Grid, Picture, User, Location
  },
  setup() {
    const loading = ref(false);
    const viewMode = ref('grid');
    const photos = ref([]);
    const classes = ref([]);
    const children = ref([]);
    const total = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(20);
    
    const filterForm = reactive({
      classId: '',
      dateRange: null,
      query: ''
    });
    
    // 瀑布流列数
    const columnCount = 3;
    
    const waterfallColumns = computed(() => {
      const columns = Array.from({ length: columnCount }, (_, i) => ({
        id: i,
        photos: []
      }));
      
      photos.value.forEach((photo, index) => {
        const columnIndex = index % columnCount;
        columns[columnIndex].photos.push(photo);
      });
      
      return columns;
    });
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    };
    
    const getChildrenNames = (recognitionData) => {
      if (!recognitionData || !recognitionData.child_ids) return '';
      
      const childNames = recognitionData.child_ids.map(id => {
        const child = children.value.find(c => c.id === id);
        return child ? child.name : '';
      }).filter(name => name);
      
      return childNames.join(', ');
    };
    
    const loadPhotos = async (page = 1) => {
      loading.value = true;
      try {
        const params = {
          page,
          limit: pageSize.value
        };
        
        if (filterForm.classId && filterForm.classId !== '') {
          params.classId = filterForm.classId;
        }
        
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
          params.startDate = filterForm.dateRange[0].toISOString().split('T')[0];
          params.endDate = filterForm.dateRange[1].toISOString().split('T')[0];
        }
        
        if (filterForm.query) {
          params.query = filterForm.query;
        }
        
        const response = await axios.get('/photos/public', { params });
        photos.value = response.data.photos;
        total.value = response.data.total;
      } catch (error) {
        ElMessage.error('加载照片失败');
      } finally {
        loading.value = false;
      }
    };
    
    const loadClasses = async () => {
      try {
        const response = await axios.get('/classes');
        classes.value = response.data;
      } catch (error) {
        ElMessage.error('加载班级列表失败');
      }
    };
    
    const loadChildren = async () => {
      try {
        const response = await axios.get('/classes/students');
        children.value = response.data;
      } catch (error) {
        console.error('加载学生列表失败');
      }
    };
    
    const resetFilter = () => {
      Object.assign(filterForm, {
        classId: '',
        dateRange: null,
        query: ''
      });
      currentPage.value = 1;
      loadPhotos(1);
    };
    
    const toggleLike = async (photo) => {
      try {
        await axios.post('/photos/like', {
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
    
    const handlePageChange = (page) => {
      currentPage.value = page;
      loadPhotos(page);
    };
    
    onMounted(() => {
      loadPhotos();
      loadClasses();
      loadChildren();
    });
    
    return {
      loading,
      viewMode,
      photos,
      classes,
      children,
      total,
      currentPage,
      pageSize,
      filterForm,
      waterfallColumns,
      formatDate,
      getChildrenNames,
      loadPhotos,
      resetFilter,
      toggleLike,
      handlePageChange
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 网格视图样式 */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.photo-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: white;
}

.photo-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.photo-image {
  width: 100%;
  height: 200px;
}

.photo-footer {
  padding: 15px;
}

.photo-meta {
  margin-bottom: 10px;
}

.photo-class {
  font-weight: bold;
  color: #409EFF;
  margin: 0 0 5px 0;
  font-size: 14px;
}

.photo-date {
  color: #909399;
  font-size: 12px;
  margin: 0 0 5px 0;
}

.photo-activity {
  color: #E6A23C;
  font-size: 12px;
  margin: 0 0 5px 0;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}

.photo-children {
  color: #606266;
  font-size: 13px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.photo-actions {
  display: flex;
  justify-content: flex-end;
}

/* 瀑布流样式 */
.photo-waterfall {
  display: flex;
  gap: 15px;
}

.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.waterfall-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.waterfall-item:hover {
  transform: scale(1.02);
}

.waterfall-image {
  width: 100%;
  height: auto;
  min-height: 150px;
}

.waterfall-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
}

.waterfall-item:hover .waterfall-overlay {
  opacity: 1;
}

.overlay-content {
  padding: 15px;
  color: white;
  width: 100%;
}

.overlay-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 24px;
  min-height: 150px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .photo-waterfall {
    flex-direction: column;
  }
  
  .waterfall-column {
    width: 100%;
  }
}
</style> 