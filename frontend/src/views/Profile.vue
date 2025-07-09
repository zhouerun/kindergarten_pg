<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>个人资料</h1>
      <p>管理您的个人信息</p>
    </div>
    
    <el-card>
      <el-form 
        ref="profileForm" 
        :model="userInfo" 
        :rules="rules" 
        label-width="100px"
      >
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled />
        </el-form-item>
        
        <el-form-item label="姓名" prop="fullName">
          <el-input v-model="userInfo.fullName" />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-tag :type="userInfo.role === 'teacher' ? 'success' : 'primary'">
            {{ userInfo.role === 'teacher' ? '教师' : '家长' }}
          </el-tag>
        </el-form-item>
        
        <el-form-item label="注册时间">
          <span>{{ formatDate(userInfo.created_at) }}</span>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="updateProfile" :loading="loading">
            更新资料
          </el-button>
          <el-button @click="showPasswordDialog = true">
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 修改密码对话框 -->
    <el-dialog 
      v-model="showPasswordDialog" 
      title="修改密码" 
      width="400px"
    >
      <el-form 
        ref="passwordForm" 
        :model="passwordData" 
        :rules="passwordRules"
        label-width="80px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input 
            v-model="passwordData.oldPassword" 
            type="password" 
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordData.newPassword" 
            type="password" 
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordData.confirmPassword" 
            type="password" 
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :loading="passwordLoading">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

export default {
  name: 'ProfilePage',
  setup() {
    const profileForm = ref(null);
    const passwordForm = ref(null);
    const loading = ref(false);
    const passwordLoading = ref(false);
    const showPasswordDialog = ref(false);
    
    const userInfo = reactive({
      username: '',
      fullName: '',
      role: '',
      created_at: ''
    });
    
    const passwordData = reactive({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    const rules = {
      fullName: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
      ]
    };
    
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== passwordData.newPassword) {
        callback(new Error('两次输入密码不一致'));
      } else {
        callback();
      }
    };
    
    const passwordRules = {
      oldPassword: [
        { required: true, message: '请输入原密码', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ]
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    };
    
    const loadProfile = async () => {
      try {
        const response = await axios.get('/users/profile');
        Object.assign(userInfo, response.data);
      } catch (error) {
        ElMessage.error('加载个人信息失败');
      }
    };
    
    const updateProfile = async () => {
      try {
        const valid = await profileForm.value.validate();
        if (!valid) return;
        
        loading.value = true;
        
        await axios.put('/users/profile', {
          username: userInfo.username,
          full_name: userInfo.fullName,
          class_id: userInfo.classId
        });
        
        ElMessage.success('资料更新成功');
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '更新失败');
      } finally {
        loading.value = false;
      }
    };
    
    const changePassword = async () => {
      try {
        const valid = await passwordForm.value.validate();
        if (!valid) return;
        
        passwordLoading.value = true;
        
        await axios.put('/auth/change-password', {
          currentPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        });
        
        ElMessage.success('密码修改成功');
        showPasswordDialog.value = false;
        
        // 重置表单
        passwordForm.value.resetFields();
        Object.assign(passwordData, {
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '密码修改失败');
      } finally {
        passwordLoading.value = false;
      }
    };
    
    onMounted(() => {
      loadProfile();
    });
    
    return {
      userInfo,
      passwordData,
      rules,
      passwordRules,
      loading,
      passwordLoading,
      showPasswordDialog,
      profileForm,
      passwordForm,
      formatDate,
      updateProfile,
      changePassword
    };
  }
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-header h1 {
  color: #303133;
  margin-bottom: 10px;
}

.profile-header p {
  color: #909399;
  font-size: 14px;
}
</style> 