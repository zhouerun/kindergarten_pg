<template>
  <div class="class-management-container">
    <div class="page-header">
      <h1>班级管理</h1>
      <p>管理班级学生信息</p>
    </div>
    
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生列表</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加学生
          </el-button>
        </div>
      </template>
      
      <el-table :data="students" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="student_number" label="学号" width="120" />
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="class_name" label="班级" width="120" />
        <el-table-column prop="created_at" label="入学时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="editStudent(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="deleteStudent(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加/编辑学生对话框 -->
    <el-dialog 
      v-model="showAddDialog" 
      :title="editingStudent ? '编辑学生' : '添加学生'"
      width="400px"
    >
      <el-form 
        ref="studentForm" 
        :model="studentFormData" 
        :rules="studentRules"
        label-width="80px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="studentFormData.name" />
        </el-form-item>
        
        <el-form-item label="学号" prop="studentNumber">
          <el-input v-model="studentFormData.studentNumber" placeholder="请输入学号" />
        </el-form-item>
        
        <el-form-item label="年龄" prop="age">
          <el-input-number 
            v-model="studentFormData.age" 
            :min="1" 
            :max="10" 
            placeholder="请输入年龄"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="班级" prop="classId">
          <el-select v-model="studentFormData.classId" placeholder="请选择班级">
            <el-option 
              v-for="cls in classes" 
              :key="cls.id" 
              :label="cls.name" 
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveStudent" 
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '@/utils/axios';

export default {
  name: 'ClassManagement',
  components: {
    Plus
  },
  setup() {
    const loading = ref(false);
    const saving = ref(false);
    const showAddDialog = ref(false);
    const editingStudent = ref(null);
    const studentForm = ref(null);
    const students = ref([]);
    const classes = ref([]);
    
    const studentFormData = reactive({
      name: '',
      studentNumber: '',
      age: null,
      classId: null
    });
    
    const studentRules = {
      name: [
        { required: true, message: '请输入学生姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
      ],
      studentNumber: [
        { required: true, message: '请输入学号', trigger: 'blur' },
        { min: 1, max: 20, message: '学号长度在 1 到 20 个字符', trigger: 'blur' }
      ],
      age: [
        { required: true, message: '请输入学生年龄', trigger: 'blur' },
        { type: 'number', min: 1, max: 10, message: '年龄必须在 1 到 10 岁之间', trigger: 'blur' }
      ],
      classId: [
        { required: true, message: '请选择班级', trigger: 'change' }
      ]
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    };
    
    const loadStudents = async () => {
      loading.value = true;
      try {
        const response = await api.get('/classes/students');
        students.value = response.data;
      } catch (error) {
        ElMessage.error('加载学生列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    const loadClasses = async () => {
      try {
        const response = await api.get('/classes');
        classes.value = response.data;
      } catch (error) {
        ElMessage.error('加载班级列表失败');
      }
    };
    
    const editStudent = (student) => {
      editingStudent.value = student;
      Object.assign(studentFormData, {
        name: student.name,
        studentNumber: student.student_number || '',
        age: student.age || null,
        classId: student.class_id
      });
      showAddDialog.value = true;
    };
    
    const deleteStudent = async (student) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除学生 "${student.name}" 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        await api.delete(`/classes/students/${student.id}`);
        ElMessage.success('删除成功');
        loadStudents();
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败');
        }
      }
    };
    
    const saveStudent = async () => {
      try {
        const valid = await studentForm.value.validate();
        if (!valid) return;
        
        saving.value = true;
        
        if (editingStudent.value) {
          // 编辑
          await api.put(`/classes/students/${editingStudent.value.id}`, {
            name: studentFormData.name,
            student_number: studentFormData.studentNumber,
            age: studentFormData.age,
            class_id: studentFormData.classId
          });
          ElMessage.success('编辑成功');
        } else {
          // 添加
          await api.post('/classes/students', {
            name: studentFormData.name,
            student_number: studentFormData.studentNumber,
            age: studentFormData.age,
            class_id: studentFormData.classId
          });
          ElMessage.success('添加成功');
        }
        
        showAddDialog.value = false;
        resetForm();
        loadStudents();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '操作失败');
      } finally {
        saving.value = false;
      }
    };
    
    const resetForm = () => {
      editingStudent.value = null;
      Object.assign(studentFormData, {
        name: '',
        studentNumber: '',
        age: null,
        classId: null
      });
      studentForm.value?.resetFields();
    };
    
    onMounted(() => {
      loadStudents();
      loadClasses();
    });
    
    return {
      loading,
      saving,
      showAddDialog,
      editingStudent,
      studentForm,
      students,
      classes,
      studentFormData,
      studentRules,
      formatDate,
      editStudent,
      deleteStudent,
      saveStudent,
      resetForm
    };
  }
};
</script>

<style scoped>
.class-management-container {
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