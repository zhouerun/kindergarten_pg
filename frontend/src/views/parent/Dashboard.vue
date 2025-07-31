<template>
  <div class="parent-dashboard">
    <div class="dashboard-header">
      <h1>家长工作台</h1>
      <p>欢迎回来，{{ userInfo && userInfo.full_name ? userInfo.full_name : '家长' }}</p>
    </div>
    
    <div class="children-section">
      <h2>我的孩子</h2>
      <div class="children-scroll-container">
        <div class="children-circles">
          <!-- 孩子圆圈 -->
          <div 
            v-for="child in children" 
            :key="child.id"
            class="child-circle"
            @click="navigateToChildPhotos(child)"
          >
            <div class="circle-avatar">
              {{ child.name.charAt(0) }}
            </div>
            <div class="circle-name">{{ child.name }}</div>
          </div>
          
          <!-- 添加新孩子的圆圈 -->
          <div 
            class="child-circle add-child-circle"
            @click="navigateToBinding"
          >
            <div class="circle-avatar add-avatar">
              <el-icon><Plus /></el-icon>
            </div>
            <div class="circle-name">孩子管理</div>
          </div>
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
import { useRouter } from 'vue-router';
import { FolderOpened, Camera, User, Trophy, Plus } from '@element-plus/icons-vue';

export default {
  name: 'ParentDashboard',
  components: {
    FolderOpened,
    Camera,
    User,
    Trophy,
    Plus
  },
  setup() {
    const store = useStore();
    const router = useRouter();
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
    
    const navigateToChildPhotos = (child) => {
      // 跳转到孩子照片页面，并传递孩子信息
      router.push({
        path: '/parent/photos',
        query: { childId: child.id }
      });
    };
    
    const navigateToBinding = () => {
      router.push('/parent/binding');
    };
    
    onMounted(() => {
      loadDashboardData();
    });
    
    return {
      userInfo,
      children,
      navigateToChildPhotos,
      navigateToBinding
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

.children-section {
  margin-bottom: 40px;
}

.children-section h2 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
}

.children-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.children-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.children-circles {
  display: flex;
  gap: 5px;
  padding: 5px 0;
  min-width: max-content;
}

.child-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: transform 0.2s ease;
  min-width: 80px;
}

.child-circle:hover {
  transform: scale(1.05);
}

.circle-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.circle-avatar:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.add-avatar {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  font-size: 24px;
}

.circle-name {
  font-size: 14px;
  color: #606266;
  text-align: center;
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-actions {
  margin-bottom: 30px;
}

.main-actions :deep(.el-card) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  border: none;
  /* margin-left: 12px; */
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

.action-buttons :deep(.el-button) {
  margin-left: 0;
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
  
  .children-circles {
    gap: 15px;
  }
  
  .circle-avatar {
    width: 50px;
    height: 50px;
    font-size: 18px;
  }
  
  .circle-name {
    font-size: 12px;
    max-width: 60px;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .main-action-btn {
    height: 50px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .dashboard-header h1 {
    font-size: 24px;
  }
  
  .children-section h2 {
    font-size: 20px;
  }
  
  .children-circles {
    gap: 12px;
  }
  
  .circle-avatar {
    width: 45px;
    height: 45px;
    font-size: 16px;
  }
  
  .circle-name {
    font-size: 11px;
    max-width: 50px;
  }
  
  /* 手机端优化：确保圆圈容器有足够的空间 */
  .children-scroll-container {
    margin: 0 -15px;
    padding: 0 15px;
  }
  
  .children-circles {
    padding: 10px 0;
  }
}
</style> 