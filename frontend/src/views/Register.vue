<template>
  <div class="register-container">
    <div class="register-form">
      <div class="form-header">
        <h1>用户注册</h1>
        <p>请填写注册信息</p>
      </div>
      
      <el-form 
        ref="registerForm" 
        :model="registerData" 
        :rules="rules" 
        label-width="80px"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="registerData.username" 
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="registerData.password" 
            type="password" 
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="registerData.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="姓名" prop="fullName">
          <el-input 
            v-model="registerData.fullName" 
            placeholder="请输入真实姓名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="电话号码" prop="telephone">
          <el-input 
            v-model="registerData.telephone" 
            placeholder="请输入电话号码"
            :prefix-icon="Phone"
          />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select 
            v-model="registerData.role" 
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="教师" value="teacher"></el-option>
            <el-option label="家长" value="parent"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleRegister"
            :loading="loading"
            style="width: 100%"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-link">
        <span>已有账号？</span>
        <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Phone } from '@element-plus/icons-vue';
import api from '@/utils/axios';

export default {
  name: 'RegisterPage',
  setup() {
    const router = useRouter();
    const registerForm = ref(null);
    const loading = ref(false);
    
    const registerData = reactive({
      username: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      telephone: '',
      role: ''
    });
    
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== registerData.password) {
        callback(new Error('两次输入密码不一致'));
      } else {
        callback();
      }
    };
    
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ],
      fullName: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
      ],
      telephone: [
        { required: true, message: '请输入电话号码', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      role: [
        { required: true, message: '请选择角色', trigger: 'change' }
      ]
    };
    
    const handleRegister = async () => {
      try {
        const valid = await registerForm.value.validate();
        if (!valid) return;
        
        loading.value = true;
        
        await api.post('/auth/register', {
          username: registerData.username,
          password: registerData.password,
          role: registerData.role,
          full_name: registerData.fullName,
          telephone_number: registerData.telephone,
          class_id: registerData.classId || null
        });
        
        ElMessage.success('注册成功！请登录');
        router.push('/login');
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '注册失败');
      } finally {
        loading.value = false;
      }
    };
    
    return {
      registerForm,
      registerData,
      rules,
      loading,
      handleRegister,
      User,
      Lock,
      Phone
    };
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h1 {
  color: #303133;
  margin-bottom: 10px;
}

.form-header p {
  color: #909399;
  font-size: 14px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #909399;
}

.login-link a {
  color: #409EFF;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

/* 修复输入框文字不显示的问题 */
.register-form :deep(.el-input__inner) {
  color: #333 !important;
  background-color: #fff !important;
}

/* 修复浏览器自动填充样式 */
.register-form :deep(.el-input__inner:-webkit-autofill) {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: #333 !important;
  background-color: #fff !important;
  color: #333 !important;
}

.register-form :deep(.el-input__inner:-webkit-autofill:hover) {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: #333 !important;
}

.register-form :deep(.el-input__inner:-webkit-autofill:focus) {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: #333 !important;
}

/* 确保输入框获得焦点时正常显示 */
.register-form :deep(.el-input__inner:focus) {
  color: #333 !important;
  background-color: #fff !important;
}

/* 确保占位符文字正常显示 */
.register-form :deep(.el-input__inner::placeholder) {
  color: #a8abb2 !important;
}
</style> 