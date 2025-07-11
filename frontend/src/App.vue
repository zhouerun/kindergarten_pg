<template>
  <div id="app">
    <el-container>
      <el-header v-if="isAuthenticated" class="header">
        <div class="header-left">
          <h1 class="logo">🎈 幼儿园家校沟通系统</h1>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userInfo.full_name }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container>
        <el-aside v-if="isAuthenticated" class="sidebar" width="200px">
          <el-menu
            :default-active="$route.path"
            class="sidebar-menu"
            router
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b"
          >
            <template v-if="userInfo.role === 'teacher'">
              <el-menu-item index="/teacher">
                <el-icon><House /></el-icon>
                <span>教师工作台</span>
              </el-menu-item>
              <el-menu-item index="/teacher/upload">
                <el-icon><Upload /></el-icon>
                <span>上传照片</span>
              </el-menu-item>
              <el-menu-item index="/teacher/class">
                <el-icon><School /></el-icon>
                <span>班级管理</span>
              </el-menu-item>
              <el-menu-item index="/teacher/users">
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </el-menu-item>
            </template>
            
            <template v-if="userInfo.role === 'parent'">
              <el-menu-item index="/parent">
                <el-icon><House /></el-icon>
                <span>家长工作台</span>
              </el-menu-item>
              <el-menu-item index="/parent/binding">
                <el-icon><Link /></el-icon>
                <span>绑定孩子</span>
              </el-menu-item>
              <el-menu-item index="/parent/photos">
                <el-icon><Picture /></el-icon>
                <span>我的照片</span>
              </el-menu-item>
              <el-menu-item index="/parent/public">
                <el-icon><Camera /></el-icon>
                <span>公共照片</span>
              </el-menu-item>
            </template>
          </el-menu>
        </el-aside>

        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { Link } from '@element-plus/icons-vue';

export default {
  name: 'App',
  components: {
    Link
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const userInfo = computed(() => store.getters.userInfo);

    const handleCommand = (command) => {
      switch (command) {
        case 'profile':
          router.push('/profile');
          break;
        case 'logout':
          store.dispatch('logout');
          router.push('/login');
          break;
      }
    };

    return {
      isAuthenticated,
      userInfo,
      handleCommand
    };
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #409eff;
  color: white;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
}

.user-info:hover {
  color: #ffd04b;
}

.sidebar {
  background-color: #545c64;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.main-content {
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}
</style> 