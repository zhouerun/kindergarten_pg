<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-message">
        <h1>页面未找到</h1>
        <p>抱歉，您访问的页面不存在或已被移除</p>
      </div>
      
      <div class="error-illustration">
        <el-icon class="lost-icon" :size="120">
          <Warning />
        </el-icon>
      </div>
      
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><Back /></el-icon>
          返回上页
        </el-button>
      </div>
      
      <div class="suggestions">
        <h3>您可以尝试：</h3>
        <ul>
          <li>检查网址是否输入正确</li>
          <li>返回上一页重新操作</li>
          <li>使用导航菜单找到您需要的页面</li>
          <li>联系管理员获取帮助</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { Warning, House, Back } from '@element-plus/icons-vue';

export default {
  name: 'NotFound',
  components: {
    Warning,
    House,
    Back
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    
    const goHome = () => {
      const userRole = store.getters.userInfo?.role;
      
      if (userRole === 'teacher') {
        router.push('/teacher');
      } else if (userRole === 'parent') {
        router.push('/parent');
      } else {
        router.push('/login');
      }
    };
    
    const goBack = () => {
      if (window.history.length > 1) {
        router.go(-1);
      } else {
        goHome();
      }
    };
    
    return {
      goHome,
      goBack
    };
  }
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-content {
  background: white;
  border-radius: 20px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.not-found-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #667eea;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.error-message h1 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 15px;
  font-weight: 600;
}

.error-message p {
  font-size: 16px;
  color: #606266;
  margin-bottom: 40px;
  line-height: 1.6;
}

.error-illustration {
  margin: 40px 0;
}

.lost-icon {
  color: #e6a23c;
  opacity: 0.8;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-actions {
  margin: 40px 0;
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-actions .el-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
}

.suggestions {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 30px;
  margin-top: 40px;
  text-align: left;
}

.suggestions h3 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

.suggestions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestions li {
  padding: 8px 0;
  color: #606266;
  font-size: 14px;
  position: relative;
  padding-left: 20px;
}

.suggestions li::before {
  content: '•';
  color: #667eea;
  position: absolute;
  left: 0;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-content {
    padding: 40px 20px;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-message h1 {
    font-size: 24px;
  }
  
  .error-message p {
    font-size: 14px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    width: 200px;
  }
  
  .suggestions {
    text-align: center;
  }
  
  .suggestions ul {
    text-align: left;
  }
}

/* 动画效果 */
.not-found-content {
  animation: slideIn 0.6s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-actions .el-button {
  transition: all 0.3s ease;
}

.error-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
</style> 