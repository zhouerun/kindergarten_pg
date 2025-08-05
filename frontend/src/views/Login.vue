<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>幼儿园成长相册</h1>
        <p>家校沟通更便捷</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            clearable
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item class="login-button">
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
            style="background-color: #57B9FF;"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>测试账号：</p>
        <p>教师：teacher1 / 123456</p>
        <p>家长：parent1 / 123456</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

export default {
  name: 'LoginPage',
  setup() {
    const store = useStore();
    const router = useRouter();
    const loginForm = reactive({
      username: '',
      password: ''
    });
    
    const loginRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
      ]
    };
    
    const loading = computed(() => store.getters.isLoading);
    const loginFormRef = ref(null);
    
    const handleLogin = async () => {
      if (!loginFormRef.value) return;
      
      try {
        await loginFormRef.value.validate();
        
        const response = await store.dispatch('login', loginForm);
        
        ElMessage.success('登录成功');
        
        // 根据用户角色跳转到相应页面
        if (response.user.role === 'teacher') {
          router.push('/teacher');
        } else if (response.user.role === 'parent') {
          router.push('/parent');
        } else {
          router.push('/');
        }
      } catch (error) {
        ElMessage.error(error.message || '登录失败');
      }
    };
    
    return {
      loginForm,
      loginRules,
      loading,
      loginFormRef,
      handleLogin
    };
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d6efff 0%, lab(84.56% -8.8 -23.66) 50%, #ccdde7 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px 30px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #333;
  font-size: 28px;
  margin-bottom: 10px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-form .el-form-item {
  margin-bottom: 20px;
}

.login-button {
  margin-bottom: 0;
}

.login-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.login-footer {
  text-align: center;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.login-footer p {
  margin: 5px 0;
}

/* 修复输入框文字不显示的问题 */
.login-form :deep(.el-input__inner) {
  color: #333 !important;
  background-color: #fff !important;
}

/* 修复浏览器自动填充样式 */
.login-form :deep(.el-input__inner:-webkit-autofill) {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: #333 !important;
  background-color: #fff !important;
  color: #333 !important;
}

.login-form :deep(.el-input__inner:-webkit-autofill:hover) {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: #333 !important;
}

.login-form :deep(.el-input__inner:-webkit-autofill:focus) {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: #333 !important;
}

/* 确保输入框获得焦点时正常显示 */
.login-form :deep(.el-input__inner:focus) {
  color: #333 !important;
  background-color: #fff !important;
}

/* 确保占位符文字正常显示 */
.login-form :deep(.el-input__inner::placeholder) {
  color: #a8abb2 !important;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  .login-header h1 {
    font-size: 24px;
  }
}
</style> 