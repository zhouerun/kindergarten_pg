<template>
  <div class="teacher-dashboard">
    <div class="dashboard-header">
      <h1>教师工作台</h1>
      <p>欢迎回来，{{ userInfo.full_name }}老师</p>
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
            <template #header>
              <div class="card-header">
                <span>班级信息</span>
                <el-button type="primary" size="small" @click="$router.push('/teacher/class')">
                  管理班级
                </el-button>
              </div>
            </template>
            
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
            <template #header>
              <div class="card-header">
                <span>快速操作</span>
              </div>
            </template>
            
            <div class="quick-actions">
              <el-button 
                type="primary" 
                size="large" 
                @click="$router.push('/teacher/upload')"
                class="action-btn"
              >
                <el-icon><Upload /></el-icon>
                上传照片
              </el-button>
              
              <el-button 
                type="warning" 
                size="large" 
                @click="$router.push('/teacher/photos')"
                class="action-btn"
              >
                <el-icon><Picture /></el-icon>
                照片管理
              </el-button>
              
              <el-button 
                type="success" 
                size="large" 
                @click="$router.push('/teacher/class')"
                class="action-btn"
              >
                <el-icon><School /></el-icon>
                班级管理
              </el-button>
              
              <el-button 
                type="info" 
                size="large" 
                @click="$router.push('/teacher/users')"
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
import api from '@/utils/axios';

export default {
  name: 'TeacherDashboard',
  setup() {
    const store = useStore();
    const userInfo = computed(() => store.getters.userInfo);
    
    const classInfo = ref({});
    const recentStudents = ref([]);
    const parentCount = ref(0);
    const todayPhotoCount = ref(0);
    
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('zh-CN');
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
        todayPhotoCount.value = Math.floor(Math.random() * 10) + 1;
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
      formatDate
    };
  }
};
</script>

<style scoped>
.teacher-dashboard {
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

.dashboard-stats {
  margin-bottom: 30px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #409eff;
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

.class-info {
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.info-item label {
  min-width: 100px;
  font-weight: 500;
  color: #333;
}

.info-item span {
  color: #666;
}

.recent-students h4 {
  margin-bottom: 15px;
  color: #333;
}

.student-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.student-item {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
}

.student-item .el-avatar {
  margin-right: 5px;
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
  .dashboard-stats .el-col {
    margin-bottom: 15px;
  }
  
  .dashboard-content .el-col {
    margin-bottom: 20px;
  }
}
</style> 