<template>
  <div class="parent-dashboard">
    <div class="dashboard-header">
      <h1>家长工作台</h1>
      <p>欢迎回来，{{ userInfo.full_name }}</p>
    </div>
    
    <div class="children-info" v-if="children.length > 0">
      <h2>我的孩子</h2>
      <div class="children-cards">
        <div 
          v-for="child in children" 
          :key="child.id"
          class="child-card"
        >
          <el-card>
            <div class="child-info">
              <el-avatar size="large" class="child-avatar">
                {{ child.name.charAt(0) }}
              </el-avatar>
              <div class="child-details">
                <h3>{{ child.name }}</h3>
                <p>{{ child.class_name }}</p>
                <div class="child-stats">
                  <span class="stat-item">
                    <el-icon><Picture /></el-icon>
                    {{ child.photo_count || 0 }}张照片
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
    
    <div class="dashboard-stats">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Picture /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ totalPhotos }}</div>
                <div class="stat-label">我的照片</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Camera /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ publicPhotos }}</div>
                <div class="stat-label">公共照片</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ todayPhotos }}</div>
                <div class="stat-label">今日新增</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="dashboard-content">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最新照片</span>
                <el-button type="primary" size="small" @click="$router.push('/parent/photos')">
                  查看更多
                </el-button>
              </div>
            </template>
            
            <div class="recent-photos">
              <div 
                v-for="photo in recentPhotos" 
                :key="photo.id"
                class="photo-item"
              >
                <el-image
                  :src="photo.path"
                  :preview-src-list="[photo.path]"
                  class="photo-image"
                  fit="cover"
                />
                <div class="photo-info">
                  <div class="photo-children">
                    <span 
                      v-for="child in photo.children" 
                      :key="child.id"
                      class="child-tag"
                    >
                      {{ child.name }}
                    </span>
                  </div>
                  <div class="photo-meta">
                    <span class="photo-date">{{ formatDate(photo.created_at) }}</span>
                    <span class="photo-likes">
                      <el-icon><Star /></el-icon>
                      {{ photo.like_count }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>快速操作</span>
              </div>
            </template>
            
            <div class="quick-actions">
              <el-button 
                type="primary" 
                size="large" 
                @click="$router.push('/parent/photos')"
                class="action-btn"
              >
                <el-icon><Picture /></el-icon>
                查看我的照片
              </el-button>
              
              <el-button 
                type="success" 
                size="large" 
                @click="$router.push('/parent/public')"
                class="action-btn"
              >
                <el-icon><Camera /></el-icon>
                浏览公共照片
              </el-button>
              
              <el-button 
                type="info" 
                size="large" 
                @click="handleSearch"
                class="action-btn"
              >
                <el-icon><Search /></el-icon>
                搜索照片
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 搜索对话框 -->
    <el-dialog v-model="searchVisible" title="搜索照片" width="400px">
      <el-form>
        <el-form-item>
          <el-input
            v-model="searchQuery"
            placeholder="请输入搜索关键词"
            clearable
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="searchVisible = false">取消</el-button>
        <el-button type="primary" @click="performSearch">搜索</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

export default {
  name: 'ParentDashboard',
  setup() {
    const store = useStore();
    const router = useRouter();
    const userInfo = computed(() => store.getters.userInfo);
    
    const children = ref([]);
    const recentPhotos = ref([]);
    const totalPhotos = ref(0);
    const publicPhotos = ref(0);
    const todayPhotos = ref(0);
    const searchVisible = ref(false);
    const searchQuery = ref('');
    
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('zh-CN');
    };
    
    const loadDashboardData = async () => {
      try {
        // 获取用户信息（包含孩子信息）
        await store.dispatch('fetchUserProfile');
        children.value = userInfo.value.children || [];
        
        // 获取私有照片
        const privateResponse = await store.dispatch('fetchPrivatePhotos', { limit: 6 });
        recentPhotos.value = privateResponse.photos || [];
        totalPhotos.value = privateResponse.photos?.length || 0;
        
        // 获取公共照片数量
        const publicResponse = await store.dispatch('fetchPublicPhotos', { limit: 100 });
        publicPhotos.value = publicResponse.photos?.length || 0;
        
        // 模拟今日新增
        todayPhotos.value = Math.floor(Math.random() * 5) + 1;
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };
    
    const handleSearch = () => {
      searchVisible.value = true;
      searchQuery.value = '';
    };
    
    const performSearch = async () => {
      if (!searchQuery.value.trim()) {
        ElMessage.warning('请输入搜索关键词');
        return;
      }
      
      try {
        await store.dispatch('searchPhotos', searchQuery.value);
        searchVisible.value = false;
        router.push('/parent/public');
        ElMessage.success('搜索完成');
      } catch (error) {
        ElMessage.error('搜索失败');
      }
    };
    
    onMounted(() => {
      loadDashboardData();
    });
    
    return {
      userInfo,
      children,
      recentPhotos,
      totalPhotos,
      publicPhotos,
      todayPhotos,
      searchVisible,
      searchQuery,
      formatDate,
      handleSearch,
      performSearch
    };
  }
};
</script>

<style scoped>
.parent-dashboard {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #333;
  font-size: 28px;
  margin-bottom: 10px;
}

.dashboard-header p {
  color: #666;
  font-size: 16px;
}

.children-info {
  margin-bottom: 30px;
}

.children-info h2 {
  color: #333;
  margin-bottom: 20px;
}

.children-cards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.child-card {
  flex: 1;
  min-width: 250px;
}

.child-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.child-avatar {
  background: #409eff;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.child-details h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.child-details p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.child-stats {
  display: flex;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.dashboard-stats {
  margin-bottom: 30px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card .stat-item {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #67c23a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 15px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.dashboard-content .el-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.photo-item {
  text-align: center;
}

.photo-image {
  width: 100%;
  height: 100px;
  border-radius: 8px;
  cursor: pointer;
}

.photo-info {
  margin-top: 8px;
}

.photo-children {
  margin-bottom: 5px;
}

.child-tag {
  display: inline-block;
  background: #e4e7ed;
  color: #606266;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  margin-right: 5px;
}

.photo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.photo-likes {
  display: flex;
  align-items: center;
  gap: 2px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .children-cards {
    flex-direction: column;
  }
  
  .dashboard-stats .el-col {
    margin-bottom: 15px;
  }
  
  .dashboard-content .el-col {
    margin-bottom: 20px;
  }
  
  .recent-photos {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style> 