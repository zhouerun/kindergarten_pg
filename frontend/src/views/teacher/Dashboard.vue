/* eslint-disable */

<template>
  <div class="teacher-dashboard">
    <!-- 装饰性背景元素 -->
    <div class="decoration-elements">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>
    
    <div class="dashboard-header">
      <div class="header-icon">🎓</div>
      <h1>教师工作台</h1>
      <p>欢迎回来，{{ userInfo && userInfo.full_name ? userInfo.full_name : '老师' }}老师</p>
      <!-- <div class="welcome-decoration">✨ 今天也要加油哦！✨</div> -->
    </div>
    
    <div class="dashboard-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><School /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ classInfo.student_count || 0 }}</div>
                <div class="stat-label">班级学生</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Camera /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ classInfo.photo_count || 0 }}</div>
                <div class="stat-label">上传照片</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ parentCount }}</div>
                <div class="stat-label">家长用户</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ todayPhotoCount }}</div>
                <div class="stat-label">今日上传</div>
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
            <div class="card-header">
              <span>班级信息</span>
              <el-button type="primary" size="small" @click="$router.push('/teacher/class')">
                管理班级
              </el-button>
            </div>
            
            <div class="class-info">
              <div class="info-item">
                <label>班级名称：</label>
                <span>{{ classInfo.name || '未分配班级' }}</span>
              </div>
              <div class="info-item">
                <label>学生人数：</label>
                <span>{{ classInfo.student_count || 0 }}人</span>
              </div>
              <div class="info-item">
                <label>创建时间：</label>
                <span>{{ formatDate(classInfo.created_at) }}</span>
              </div>
            </div>
            
            <div class="recent-students" v-if="recentStudents.length > 0">
              <h4>最近添加的学生</h4>
              <div class="student-list">
                <div 
                  v-for="student in recentStudents" 
                  :key="student.id"
                  class="student-item"
                >
                  <el-avatar size="small">{{ student.name.charAt(0) }}</el-avatar>
                  <span>{{ student.name }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <div class="card-header">
              <span>快速操作</span>
            </div>
            
            <div class="quick-actions">
              <el-button 
                type="primary" 
                size="large" 
                @click="handleUploadClick"
                class="action-btn"
              >
                <el-icon><Upload /></el-icon>
                上传照片
              </el-button>
              
              <el-button 
                type="warning" 
                size="large" 
                @click="handlePhotosClick"
                class="action-btn"
              >
                <el-icon><Picture /></el-icon>
                照片管理
              </el-button>
              
              <el-button 
                type="success" 
                size="large" 
                @click="handleClassClick"
                class="action-btn"
              >
                <el-icon><School /></el-icon>
                班级管理
              </el-button>
              
              <el-button 
                type="info" 
                size="large" 
                @click="handleUsersClick"
                class="action-btn"
              >
                <el-icon><User /></el-icon>
                用户管理
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import api from '@/utils/axios';

export default {
  name: 'TeacherDashboard',
  setup() {
    const store = useStore();
    const router = useRouter();
    const userInfo = computed(() => store.getters.userInfo);
    
    const classInfo = ref({});
    const recentStudents = ref([]);
    const parentCount = ref(0);
    const todayPhotoCount = ref(0);
    
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('zh-CN');
    };

    // 按钮点击处理函数
    const handleUploadClick = () => {
      console.log('点击上传照片按钮');
      router.push('/teacher/upload');
    };

    const handlePhotosClick = () => {
      console.log('点击照片管理按钮');
      router.push('/teacher/photos');
    };

    const handleClassClick = () => {
      console.log('点击班级管理按钮');
      router.push('/teacher/class');
    };

    const handleUsersClick = () => {
      console.log('点击用户管理按钮');
      router.push('/teacher/users');
    };

    const loadDashboardData = async () => {
      try {
        if (userInfo.value.class_id) {
          // 获取班级信息
          const classResponse = await api.get(`/classes/${userInfo.value.class_id}`);
          classInfo.value = classResponse.data;
          
          // 获取最近的学生
          const studentsResponse = await api.get(`/classes/${userInfo.value.class_id}/children`);
          recentStudents.value = studentsResponse.data.slice(0, 5);
        }
        
        // 获取家长用户数量
        const usersResponse = await api.get('/users?role=parent');
        parentCount.value = usersResponse.data.length;
        
        // 模拟今日上传数量
        // todayPhotoCount.value = Math.floor(Math.random() * 10) + 1;
        
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };
    
    onMounted(() => {
      loadDashboardData();
    });
    
    return {
      userInfo,
      classInfo,
      recentStudents,
      parentCount,
      todayPhotoCount,
      formatDate,
      handleUploadClick,
      handlePhotosClick,
      handleClassClick,
      handleUsersClick
    };
  }
};
</script>

<style scoped>
.teacher-dashboard {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  font-family: 'Comic Sans MS', 'Arial Rounded MT Bold', 'Arial', sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* 装饰性背景元素 */
.decoration-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff6b9d, #f093fb);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  top: 20%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #43e97b, #38f9d7);
  bottom: 20%;
  left: 5%;
  animation-delay: 4s;
}

.shape-4 {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  bottom: 10%;
  right: 10%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.dashboard-header {
  margin-bottom: 30px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  position: relative;
  z-index: 1;
}

.header-icon {
  font-size: 48px;
  margin-bottom: 15px;
  animation: bounce 2s infinite;
}

.welcome-decoration {
  margin-top: 15px;
  font-size: 14px;
  color: #ff6b9d;
  font-weight: bold;
  opacity: 0.8;
}

.dashboard-header h1 {
  color: #ff6b9d;
  font-size: 32px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: bold;
}

.dashboard-header p {
  color: #666;
  font-size: 18px;
  margin: 0;
}

.dashboard-stats {
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.stat-card {
  border: none;
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-right: 20px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #ff6b9d;
  margin-bottom: 5px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.stat-label {
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

.dashboard-content {
  position: relative;
  z-index: 1;
}

.dashboard-content .el-card {
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  overflow: hidden;
  transition: all 0.3s ease;
}

.dashboard-content .el-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #8b4513;
  font-weight: bold;
  font-size: 18px;
}

.class-info {
  margin-bottom: 20px;
  padding: 0 25px;
}

.info-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 15px;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(5px);
}

.info-item label {
  min-width: 100px;
  font-weight: bold;
  color: #ff6b9d;
  font-size: 16px;
}

.info-item span {
  color: #666;
  font-weight: 500;
}

.recent-students {
  padding: 0 25px 25px;
}

.recent-students h4 {
  margin-bottom: 15px;
  color: #ff6b9d;
  font-size: 18px;
  font-weight: bold;
}

.student-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.student-item {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  box-shadow: 0 4px 15px rgba(168, 237, 234, 0.3);
  transition: all 0.3s ease;
}

.student-item:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(168, 237, 234, 0.4);
}

.student-item .el-avatar {
  margin-right: 8px;
  border: 2px solid #fff;
}

.quick-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 25px;
}

.action-btn {
  width: 45%;
  height: 80px;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-left: 0;
  border-radius: 20px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
  z-index: 1;
}

.action-btn:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.action-btn:active {
  transform: translateY(-2px) scale(0.98);
}

.action-btn:nth-child(1) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.action-btn:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
}

.action-btn:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
}

.action-btn:nth-child(4) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border: none;
}

@media (max-width: 768px) {
  .teacher-dashboard {
    padding: 15px;
  }

  .dashboard-header {
    padding: 20px;
    margin-bottom: 20px;
  }

  .dashboard-header h1 {
    font-size: 24px;
  }

  .dashboard-header p {
    font-size: 16px;
  }

  .dashboard-stats .el-col {
    margin-bottom: 15px;
    width: 100%;
    max-width: 100%;
  }

  .dashboard-stats .el-row {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .stat-item {
    padding: 15px;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
    margin-right: 15px;
  }

  .stat-number {
    font-size: 24px;
  }

  .stat-label {
    font-size: 14px;
  }

  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .dashboard-content .el-row {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .dashboard-content .el-col {
    width: 100%;
    max-width: 100%;
  }

  .card-header {
    padding: 15px 20px;
    font-size: 16px;
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .class-info {
    padding: 0 20px;
  }

  .info-item {
    padding: 8px;
    margin-bottom: 10px;
  }

  .info-item label {
    min-width: 80px;
    font-size: 14px;
  }

  .recent-students {
    padding: 0 20px 20px;
  }

  .recent-students h4 {
    font-size: 16px;
  }

  .student-list {
    gap: 8px;
  }

  .student-item {
    padding: 6px 12px;
    font-size: 13px;
  }

  .quick-actions {
    flex-direction: column;
    gap: 15px;
    padding: 20px;
  }

  .action-btn {
    width: 100%;
    height: 70px;
    font-size: 15px;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }
}
</style> 