<template>
  <div class="parent-dashboard">
    <div class="dashboard-header">
      <h1>家长工作台</h1>
      <p>欢迎回来，{{ userInfo && userInfo.full_name ? userInfo.full_name : '家长' }}</p>
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
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
    
    <div class="main-actions">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>主要功能</span>
          </div>
        </template>
        
        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large" 
            @click="$router.push('/parent/photos')"
            class="main-action-btn"
          >
            <el-icon><FolderOpened /></el-icon>
            查看我的照片集
          </el-button>
          
          <el-button 
            type="success" 
            size="large" 
            @click="$router.push('/parent/public')"
            class="main-action-btn"
          >
            <el-icon><Camera /></el-icon>
            浏览班级照片墙
          </el-button>
          
          <el-button 
            type="info" 
            size="large" 
            @click="$router.push('/parent/binding')"
            class="main-action-btn"
          >
            <el-icon><User /></el-icon>
            孩子绑定管理
          </el-button>
          
          <el-button 
            type="warning" 
            size="large" 
            @click="$router.push('/parent/honor')"
            class="main-action-btn"
          >
            <el-icon><Trophy /></el-icon>
            荣誉墙
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { FolderOpened, Camera, User, Trophy } from '@element-plus/icons-vue';

export default {
  name: 'ParentDashboard',
  components: {
    FolderOpened,
    Camera,
    User,
    Trophy
  },
  setup() {
    const store = useStore();
    const userInfo = computed(() => store.getters.userInfo);
    
    const children = ref([]);
    
    const loadDashboardData = async () => {
      try {
        // 获取用户信息（包含孩子信息）
        await store.dispatch('fetchUserProfile');
        children.value = userInfo.value.children || [];
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };
    
    onMounted(() => {
      loadDashboardData();
    });
    
    return {
      userInfo,
      children
    };
  }
};
</script>

<style scoped>
.parent-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 40px;
}

.dashboard-header h1 {
  color: #303133;
  font-size: 32px;
  margin-bottom: 10px;
  font-weight: 300;
}

.dashboard-header p {
  color: #909399;
  font-size: 18px;
}

.children-info {
  margin-bottom: 40px;
}

.children-info h2 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
}

.children-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.child-card {
  transition: transform 0.2s ease;
}

.child-card:hover {
  transform: translateY(-2px);
}

.child-card :deep(.el-card) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  border: none;
}

.child-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px;
}

.child-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 20px;
  font-weight: bold;
  width: 60px;
  height: 60px;
}

.child-details h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 500;
}

.child-details p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.main-actions {
  margin-bottom: 30px;
}

.main-actions :deep(.el-card) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  border: none;
}

.card-header {
  text-align: center;
}

.card-header span {
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.main-action-btn {
  height: 60px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.main-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .parent-dashboard {
    padding: 15px;
  }
  
  .dashboard-header h1 {
    font-size: 28px;
  }
  
  .dashboard-header p {
    font-size: 16px;
  }
  
  .children-cards {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .main-action-btn {
    height: 50px;
    font-size: 14px;
  }
  
  .child-info {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .dashboard-header h1 {
    font-size: 24px;
  }
  
  .children-info h2 {
    font-size: 20px;
  }
  
  .child-info {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
}
</style> 