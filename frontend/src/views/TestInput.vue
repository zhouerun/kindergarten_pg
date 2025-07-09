<template>
  <div class="test-container">
    <div class="test-card">
      <h2>输入框测试页面</h2>
      
      <div class="form-section">
        <h3>使用 reactive 的表单</h3>
        <el-form :model="formData" label-width="80px">
          <el-form-item label="用户名">
            <el-input 
              v-model="formData.username" 
              placeholder="请输入用户名"
              @input="onUsernameInput"
            />
            <p>当前值: {{ formData.username }}</p>
            <p>字符数: {{ formData.username.length }}</p>
          </el-form-item>
          
          <el-form-item label="密码">
            <el-input 
              v-model="formData.password" 
              type="password" 
              placeholder="请输入密码"
              @input="onPasswordInput"
            />
            <p>当前值: {{ formData.password }}</p>
            <p>字符数: {{ formData.password.length }}</p>
          </el-form-item>
        </el-form>
      </div>
      
      <div class="form-section">
        <h3>使用 ref 的表单</h3>
        <el-form :model="refFormData" label-width="80px">
          <el-form-item label="用户名">
            <el-input 
              v-model="refFormData.username" 
              placeholder="请输入用户名"
            />
            <p>当前值: {{ refFormData.username }}</p>
            <p>字符数: {{ refFormData.username.length }}</p>
          </el-form-item>
          
          <el-form-item label="密码">
            <el-input 
              v-model="refFormData.password" 
              type="password" 
              placeholder="请输入密码"
            />
            <p>当前值: {{ refFormData.password }}</p>
            <p>字符数: {{ refFormData.password.length }}</p>
          </el-form-item>
        </el-form>
      </div>
      
      <el-button @click="clearAll">清空所有</el-button>
      <el-button @click="fillTest">填充测试数据</el-button>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'TestInput',
  setup() {
    // 使用 reactive
    const formData = reactive({
      username: '',
      password: ''
    });
    
    // 使用 ref
    const refFormData = ref({
      username: '',
      password: ''
    });
    
    const onUsernameInput = (value) => {
      console.log('用户名输入:', value);
      console.log('formData.username:', formData.username);
    };
    
    const onPasswordInput = (value) => {
      console.log('密码输入:', value);
      console.log('formData.password:', formData.password);
    };
    
    const clearAll = () => {
      formData.username = '';
      formData.password = '';
      refFormData.value.username = '';
      refFormData.value.password = '';
      ElMessage.success('已清空所有输入');
    };
    
    const fillTest = () => {
      formData.username = 'test123';
      formData.password = 'password123';
      refFormData.value.username = 'test456';
      refFormData.value.password = 'password456';
      ElMessage.success('已填充测试数据');
    };
    
    return {
      formData,
      refFormData,
      onUsernameInput,
      onPasswordInput,
      clearAll,
      fillTest
    };
  }
};
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
}

.form-section h3 {
  margin-top: 0;
  color: #333;
}

.form-section p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.test-card h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

/* 修复输入框文字显示问题 */
.test-card :deep(.el-input__inner) {
  color: #333 !important;
  background-color: #fff !important;
  font-size: 14px !important;
}

.test-card :deep(.el-input__inner:-webkit-autofill) {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: #333 !important;
}

.test-card :deep(.el-input__inner:focus) {
  color: #333 !important;
  background-color: #fff !important;
}

.test-card :deep(.el-input__inner::placeholder) {
  color: #a8abb2 !important;
}
</style> 