<template>
  <div class="private-photos-container">
    <div class="page-header">
      <h1>我的孩子照片</h1>
      <p>查看您孩子的专属照片</p>
    </div>
    
    <!-- 搜索栏 -->
    <el-card style="margin-bottom: 20px;">
      <el-form :model="searchForm" :inline="true">
        <el-form-item>
          <el-input 
            v-model="searchForm.query" 
            placeholder="搜索照片（如：小明在操场上）"
            style="width: 300px;"
            @keyup.enter="searchPhotos"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchPhotos">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 照片网格 -->
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>照片列表 ({{ photos.length }})</span>
          <el-button-group>
            <el-button 
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
            >
              <el-icon><Grid /></el-icon>
              网格视图
            </el-button>
            <el-button 
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
            >
              <el-icon><List /></el-icon>
              列表视图
            </el-button>
          </el-button-group>
        </div>
      </template>
      
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="photo-grid">
        <div 
          v-for="photo in photos" 
          :key="photo.id" 
          class="photo-item"
          @click="previewPhoto(photo)"
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
          
          <div class="photo-overlay">
            <div class="photo-info">
              <p class="photo-date">{{ formatDate(photo.created_at) }}</p>
              <p class="photo-activity" v-if="photo.activity">
                <el-icon><Location /></el-icon>
                {{ photo.activity }}
              </p>
              <p class="photo-children">
                <el-icon><User /></el-icon>
                {{ getChildrenNames(photo.recognition_data) }}
              </p>
            </div>
            
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
          </div>
        </div>
      </div>
      
      <!-- 列表视图 -->
      <el-table v-else :data="photos" style="width: 100%">
        <el-table-column label="照片" width="100">
          <template #default="scope">
            <el-image 
              :src="scope.row.path" 
              style="width: 60px; height: 60px;"
              fit="cover"
              @click="previewPhoto(scope.row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="识别的学生">
          <template #default="scope">
            {{ getChildrenNames(scope.row.recognition_data) }}
          </template>
        </el-table-column>
        
        <el-table-column label="活动场景" width="120">
          <template #default="scope">
            <span v-if="scope.row.activity" class="activity-tag">
              <el-icon><Location /></el-icon>
              {{ scope.row.activity }}
            </span>
            <span v-else class="no-activity">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="拍摄时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="点赞" width="100">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              :icon="scope.row.liked ? 'StarFilled' : 'Star'"
              @click="toggleLike(scope.row)"
            >
              {{ scope.row.like_count || 0 }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Grid, List, Picture, User, Location } from '@element-plus/icons-vue';
import axios from 'axios';

export default {
  name: 'PrivatePhotos',
  components: {
    Grid, List, Picture, User, Location
  },
  setup() {
    const loading = ref(false);
    const viewMode = ref('grid');
    const photos = ref([]);
    const children = ref([]);
    const total = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(20);
    
    const searchForm = reactive({
      query: ''
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
        
        if (searchForm.query) {
          params.query = searchForm.query;
        }
        
        const response = await axios.get('/photos/private', { params });
        photos.value = response.data.photos;
        total.value = response.data.total;
      } catch (error) {
        ElMessage.error('加载照片失败');
      } finally {
        loading.value = false;
      }
    };
    
    const loadChildren = async () => {
      try {
        const response = await axios.get('/users/children');
        children.value = response.data;
      } catch (error) {
        ElMessage.error('加载孩子信息失败');
      }
    };
    
    const searchPhotos = () => {
      currentPage.value = 1;
      loadPhotos(1);
    };
    
    const resetSearch = () => {
      searchForm.query = '';
      currentPage.value = 1;
      loadPhotos(1);
    };
    
    const previewPhoto = () => {
      // 图片预览由 el-image 组件处理
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
      loadChildren();
    });
    
    return {
      loading,
      viewMode,
      photos,
      children,
      total,
      currentPage,
      pageSize,
      searchForm,
      formatDate,
      getChildrenNames,
      searchPhotos,
      resetSearch,
      previewPhoto,
      toggleLike,
      handlePageChange
    };
  }
};
</script>

<style scoped>
.private-photos-container {
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

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.photo-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.photo-item:hover {
  transform: translateY(-5px);
}

.photo-image {
  width: 100%;
  height: 200px;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: 15px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.photo-item:hover .photo-overlay {
  transform: translateY(0);
}

.photo-info {
  margin-bottom: 10px;
}

.photo-date {
  font-size: 12px;
  opacity: 0.9;
  margin: 0 0 5px 0;
}

.photo-activity {
  font-size: 12px;
  opacity: 0.9;
  margin: 0 0 5px 0;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #E6A23C;
  font-weight: 500;
}

.photo-children {
  font-size: 14px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.photo-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.activity-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #FDF6EC;
  color: #E6A23C;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #F5DAB1;
}

.no-activity {
  color: #909399;
  font-size: 12px;
}
</style> 