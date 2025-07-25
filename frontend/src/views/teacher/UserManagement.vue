/* eslint-disable */

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

      </el-table>
    </el-card>
    


  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/axios';

export default {
  name: 'UserManagement',
  setup() {
    const loading = ref(false);
    const parents = ref([]);
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    };
    
    const loadParents = async () => {
      loading.value = true;
      try {
        const response = await api.get('/users/parents');
        parents.value = response.data;
      } catch (error) {
        ElMessage.error('加载家长列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(() => {
      loadParents();
    });
    
    return {
      loading,
      parents,
      formatDate
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