<template>
<div class="login-container" :class="{ 'dark-theme': isDarkTheme }">
<div class="login-card">
    <!-- Logo区域 -->
    <div class="logo-section">
    <div class="logo-icon">
        <img src="../assets/logo.png" alt="logo" class="logo-img">
    </div>
    <h1 class="logo-text">智大蓝图</h1>
    </div>

    <!-- 登录表单 -->
    <div class="login-form">
    <!-- 登录方式切换 -->
    <div class="login-tabs">
        <div 
        class="tab-item" 
        :class="{ active: loginMethod === 'code' }"
        @click="loginMethod = 'code'"
        >
        验证码登录
        </div>
        <div 
        class="tab-item" 
        :class="{ active: loginMethod === 'password' }"
        @click="loginMethod = 'password'"
        >
        密码登录
        </div>
    </div>


    <!-- 登录提示 -->
    <div class="login-hint">
        支持校园账号和手机号登录。
    </div>

    <!-- 表单内容 -->
    <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="form-content"
        @submit.prevent="handleLogin"
    >
        <!-- 手机号/用户名输入 -->
        <div class="form-item">
        <label class="form-label">
            <span class="required">*</span>
            {{ loginMethod === 'code' ? '手机号' : '手机号/用户名' }}
        </label>
        <div class="input-wrapper">
            <el-icon class="input-icon"><User /></el-icon>
            <el-input
            v-model="loginForm.username"
            :placeholder="loginMethod === 'code' ? '请输入手机号' : '请输入手机号或用户名'"
            class="custom-input"
            clearable
            />
        </div>
        </div>

        <!-- 验证码/密码输入 -->
        <div class="form-item">
        <label class="form-label">
            <span class="required">*</span>
            {{ loginMethod === 'code' ? '验证码' : '密码' }}
        </label>
        <div class="input-wrapper">
            <el-icon class="input-icon">
            <Lock v-if="loginMethod === 'password'" />
            <Key v-else />
            </el-icon>
            <el-input
            v-model="loginForm.password"
            :type="loginMethod === 'password' ? (showPassword ? 'text' : 'password') : 'text'"
            :placeholder="loginMethod === 'code' ? '请输入验证码' : '请输入密码'"
            class="custom-input"
            clearable
            @keyup.enter="handleLogin"
            >
            <template v-if="loginMethod === 'password'" #suffix>
                <el-icon 
                class="password-toggle"
                @click="showPassword = !showPassword"
                >
                <View v-if="showPassword" />
                <Hide v-else />
                </el-icon>
            </template>
            </el-input>
            
            <!-- 发送验证码按钮 -->
            <el-button
            v-if="loginMethod === 'code'"
            class="send-code-btn"
            :disabled="countdown > 0"
            @click="sendVerificationCode"
            >
            {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </el-button>
        </div>
        </div>

        <!-- 登录按钮 -->
        <div class="form-item">
        <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
        >
            {{ loading ? '登录中...' : '登录' }}
        </el-button>
        </div>
    </el-form>

    <!-- 底部链接 -->
    <div class="bottom-links">
        <a href="#" class="link-item">忘记密码?</a>
        <a href="#" class="link-item">注册</a>
    </div>

    <!-- 协议同意 -->
    <div class="agreement">
        登录即代表同意
        <a href="#" class="agreement-link">服务条款</a>
        和
        <a href="#" class="agreement-link">隐私政策</a>
    </div>
    </div>
</div>

<!-- 主题切换按钮 -->
<div class="theme-toggle" @click="toggleTheme">
    <el-icon v-if="isDarkTheme"><Sunny /></el-icon>
    <el-icon v-else><Moon /></el-icon>
</div>
</div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Key, View, Hide, Sunny, Moon } from '@element-plus/icons-vue';
import api from '../utils/axios';

export default {
name: 'Login2Page',
components: {
User,
Lock,
Key,
View,
Hide,
Sunny,
Moon
},
setup() {
const store = useStore();
const router = useRouter();
const loginFormRef = ref(null);

// 响应式数据
const loginMethod = ref('password'); // 'password' 或 'code'
const showPassword = ref(false);
const loading = ref(false);
const countdown = ref(0);
const isDarkTheme = ref(false);

const loginForm = reactive({
    username: '',
    password: ''
});

const loginRules = computed(() => ({
    username: [
    { required: true, message: '请输入手机号/用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
    ],
    password: [
    { required: true, message: loginMethod.value === 'code' ? '请输入验证码' : '请输入密码', trigger: 'blur' },
    { 
        min: loginMethod.value === 'code' ? 4 : 6, 
        max: loginMethod.value === 'code' ? 6 : 50, 
        message: loginMethod.value === 'code' ? '验证码长度为4-6位' : '密码长度在 6 到 50 个字符', 
        trigger: 'blur' 
    }
    ]
}));

const detectSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDarkTheme.value = true;
    }
};

const setupThemeListener = () => {
    if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        isDarkTheme.value = e.matches;
    });
    }
};

const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value;
};

const sendVerificationCode = async () => {
    if (!loginForm.username) {
    ElMessage.warning('请先输入手机号');
    return;
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(loginForm.username)) {
    ElMessage.warning('请输入正确的手机号');
    return;
    }

    try {
    // 调用发送验证码的API
    const response = await api.post('/auth/send-code', { phone: loginForm.username });
    
    if (response.data.success) {
        ElMessage.success('验证码已发送');
    } else {
        ElMessage.error('发送验证码失败');
        return;
    }
    countdown.value = 60;
    const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
        clearInterval(timer);
        }
    }, 1000);
    } catch (error) {
    ElMessage.error('发送验证码失败');
    }
};

// 处理登录
const handleLogin = async () => {
    if (!loginFormRef.value) return;
    
    try {
    await loginFormRef.value.validate();
    loading.value = true;
    
    let response;
    
    if (loginMethod.value === 'password') {
        // 密码登录
        const loginData = {
        username: loginForm.username,
        password: loginForm.password
        };
        
        response = await store.dispatch('login2', loginData);
    } else {
        // 验证码登录
        const loginData = {
        phone: loginForm.username,
        smsCode: loginForm.password
        };
        
        response = await store.dispatch('phoneLogin', loginData);
    }
    ElMessage.success('登录成功');
    
    // 添加调试信息
    console.log('登录成功，完整响应:', response);
    console.log('登录成功，用户信息:', response.user);
    console.log('用户mapped_role:', response.user?.mapped_role);
    console.log('用户role:', response.user?.role);
    
    // 根据映射的角色跳转到相应页面
    const userRole = response.user?.mapped_role || response.user?.role;
    console.log('准备跳转到角色:', userRole);
    
    // 检查store中的状态
    console.log('Store中的token:', store.state.token);
    console.log('Store中的user:', store.state.user);
    console.log('Store getter - isAuthenticated:', store.getters.isAuthenticated);
    console.log('Store getter - userInfo:', store.getters.userInfo);
    
    if (userRole === 'teacher') {
      console.log('跳转到教师页面');
      router.push('/teacher');
    } else if (userRole === 'parent') {
      console.log('跳转到家长页面');
      router.push('/parent');
    } else {
      console.log('未知角色，跳转到首页');
      router.push('/');
    }
    } catch (error) {
    ElMessage.error(error.message || '登录失败');
    } finally {
      loading.value = false;
    }
}

onMounted(() => {
    detectSystemTheme();
    setupThemeListener();
});

return {
    loginFormRef,
    loginMethod,
    showPassword,
    loading,
    countdown,
    isDarkTheme,
    loginForm,
    loginRules,
    sendVerificationCode,
    handleLogin,
    toggleTheme
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
  background: linear-gradient(135deg, #fffbfb 0%, #ffffff 100%);
  padding: 20px;
  position: relative;
  transition: all 0.3s ease;
}

.login-container.dark-theme {
  background: linear-gradient(135deg, #1a1e22 0%, #000000 100%);
}

.login-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px 30px;
  transition: all 0.3s ease;
}

.dark-theme .login-card {
  background: #303030;
  color: white;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* Logo区域 */
.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  gap: 12px;
}

.logo-icon {
  color: #409eff;
  font-size: 32px;
}

.dark-theme .logo-icon {
  color: #67c23a;
}

.logo-img {
    width: 50px;
    aspect-ratio: 1/1;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.dark-theme .logo-text {
  color: white;
}

/* 登录表单 */
.login-form {
  width: 100%;
}

/* 登录方式切换 */
.login-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.dark-theme .login-tabs {
  border-bottom-color: #4a5568;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  transition: all 0.3s ease;
  position: relative;
}

.dark-theme .tab-item {
  color: #a0aec0;
}

.tab-item.active {
  color: #409eff;
  font-weight: 500;
}

.dark-theme .tab-item.active {
  color: #67c23a;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #409eff;
  border-radius: 1px;
}

.dark-theme .tab-item.active::after {
  background: #67c23a;
}

/* 登录提示 */
.login-hint {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-bottom: 20px;
}

.dark-theme .login-hint {
  color: #a0aec0;
}

/* 表单内容 */
.form-content {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.dark-theme .form-label {
  color: #e2e8f0;
}

.required {
  color: #f56c6c;
  margin-right: 4px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #c0c4cc;
  z-index: 1;
}

.dark-theme .input-icon {
  color: #718096;
}

.custom-input {
  width: 100%;
}

.custom-input :deep(.el-input__wrapper) {
    padding: 0;
    overflow: hidden;
    background: transparent;
    border-radius: 5px;
}

.dark-theme .custom-input :deep(.el-input__wrapper) {
    background: transparent;
}

.custom-input :deep(.el-input__suffix) {
    padding-right: 5px;
    margin: 0;
}

.custom-input:focus {
    border-color: #003061;
}

.custom-input :deep(.el-input__inner) {
  padding-left: 40px;
  height: 44px;
  background: transparent;
  color: #333;
  transition: all 0.3s ease;
}

.dark-theme .custom-input :deep(.el-input__inner) {
  color: white;
}


/* 占位符样式 */
.custom-input :deep(.el-input__inner::placeholder) {
  color: #a8abb2;
}

.dark-theme .custom-input :deep(.el-input__inner::placeholder) {
  color: #718096;
}



.password-toggle {
  cursor: pointer;
  color: #c0c4cc;
  transition: color 0.3s ease;
}

.dark-theme .password-toggle {
  color: #718096;
}

.password-toggle:hover {
  color: #409eff;
}

.dark-theme .password-toggle:hover {
  color: #67c23a;
}

/* 发送验证码按钮 */
.send-code-btn {
  position: absolute;
  right: 8px;
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  border-radius: 6px;
  background: #409eff;
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dark-theme .send-code-btn {
  background: #67c23a;
}

.send-code-btn:hover {
  background: #337ecc;
}

.dark-theme .send-code-btn:hover {
  background: #5aad2a;
}

.send-code-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.dark-theme .send-code-btn:disabled {
  background: #4a5568;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: #409eff;
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.dark-theme .login-btn {
  background: #67c23a;
}

.login-btn:hover {
  background: #337ecc;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.dark-theme .login-btn:hover {
  background: #5aad2a;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.login-btn:active {
  transform: translateY(0);
}

/* 底部链接 */
.bottom-links {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.link-item {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.dark-theme .link-item {
  color: #67c23a;
}

.link-item:hover {
  color: #337ecc;
  text-decoration: underline;
}

.dark-theme .link-item:hover {
  color: #5aad2a;
}

/* 协议同意 */
.agreement {
  text-align: center;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.dark-theme .agreement {
  color: #a0aec0;
}

.agreement-link {
  color: #409eff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.dark-theme .agreement-link {
  color: #67c23a;
}

.agreement-link:hover {
  color: #337ecc;
  text-decoration: underline;
}

.dark-theme .agreement-link:hover {
  color: #5aad2a;
}

/* 主题切换按钮 */
.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .theme-toggle {
  background: rgba(44, 62, 80, 0.9);
  color: white;
}

.theme-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.theme-toggle .el-icon {
  font-size: 18px;
  color: #409eff;
}

.dark-theme .theme-toggle .el-icon {
  color: #67c23a;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .logo-text {
    font-size: 20px;
  }
  
  .theme-toggle {
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
  }
  
  .theme-toggle .el-icon {
    font-size: 16px;
  }
}


</style> 