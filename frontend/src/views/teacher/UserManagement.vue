<template>
  <div class="user-management-container">
    <div class="page-header">
      <h1>用户管理</h1>
      <p>管理家长用户和关联关系</p>
    </div>
    
    <el-card>
      <template #header>
        <div class="card-header">
          <span>家长用户列表</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加家长
          </el-button>
        </div>
      </template>
      
      <el-table :data="parents" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="full_name" label="姓名" width="120" />
        <el-table-column label="关联学生">
          <template #default="scope">
            <el-tag 
              v-for="child in scope.row.children" 
              :key="child.id"
              size="small"
              style="margin-right: 5px;"
            >
              {{ child.name }}
            </el-tag>
            <span v-if="!scope.row.children || scope.row.children.length === 0">
              暂无关联
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="editParent(scope.row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加/编辑家长对话框 -->
    <el-dialog 
      v-model="showAddDialog" 
      :title="editingParent ? '编辑家长' : '添加家长'"
      width="400px"
    >
      <el-form 
        ref="parentForm" 
        :model="parentFormData" 
        :rules="parentRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="parentFormData.username" />
        </el-form-item>
        
        <el-form-item label="姓名" prop="fullName">
          <el-input v-model="parentFormData.fullName" />
        </el-form-item>
        
        <el-form-item v-if="!editingParent" label="密码" prop="password">
          <el-input 
            v-model="parentFormData.password" 
            type="password" 
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveParent" 
          :loading="saving"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import axios from 'axios';

export default {
  name: 'UserManagement',
  components: {
    Plus
  },
  setup() {
    const loading = ref(false);
    const saving = ref(false);
    const showAddDialog = ref(false);
    const editingParent = ref(null);
    const parentForm = ref(null);
    const parents = ref([]);
    
    const parentFormData = reactive({
      username: '',
      fullName: '',
      password: ''
    });
    
    const parentRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      fullName: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
      ]
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    };
    
    const loadParents = async () => {
      loading.value = true;
      try {
        const response = await axios.get('/users/parents');
        parents.value = response.data;
      } catch (error) {
        ElMessage.error('加载家长列表失败');
      } finally {
        loading.value = false;
      }
    };
    

    
    const editParent = (parent) => {
      editingParent.value = parent;
      Object.assign(parentFormData, {
        username: parent.username,
        fullName: parent.full_name,
        password: ''
      });
      showAddDialog.value = true;
    };
    

    
    const saveParent = async () => {
      try {
        const valid = await parentForm.value.validate();
        if (!valid) return;
        
        saving.value = true;
        
        if (editingParent.value) {
          // 编辑
          await axios.put(`/users/${editingParent.value.id}`, {
            username: parentFormData.username,
            full_name: parentFormData.fullName,
            class_id: parentFormData.classId
          });
          ElMessage.success('编辑成功');
        } else {
          // 添加
          await axios.post('/auth/register', {
            username: parentFormData.username,
            password: parentFormData.password,
            role: 'parent',
            full_name: parentFormData.fullName,
            class_id: parentFormData.classId
          });
          ElMessage.success('添加成功');
        }
        
        showAddDialog.value = false;
        resetForm();
        loadParents();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '操作失败');
      } finally {
        saving.value = false;
      }
    };
    

    
    const resetForm = () => {
      editingParent.value = null;
      Object.assign(parentFormData, {
        username: '',
        fullName: '',
        password: ''
      });
      parentForm.value?.resetFields();
    };
    
    onMounted(() => {
      loadParents();
    });
    
    return {
      loading,
      saving,
      showAddDialog,
      editingParent,
      parentForm,
      parents,
      parentFormData,
      parentRules,
      formatDate,
      editParent,
      saveParent,
      resetForm
    };
  }
};
</script>

<style scoped>
.user-management-container {
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #303133;
  margin-bottom: 10px;
}

.page-header p {
  color: #909399;
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 