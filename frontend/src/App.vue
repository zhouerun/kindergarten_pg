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
              <span class="user-name">{{ userInfo.full_name }}</span>
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
        <el-aside v-if="isAuthenticated" class="sidebar" :width="sidebarWidth">
          <el-menu
            :default-active="$route.path"
            class="sidebar-menu"
            router
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b"
            :collapse="isCollapse"
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
              <el-menu-item index="/teacher/photos">
                <el-icon><Picture /></el-icon>
                <span>照片管理</span>
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
                <span>孩子照片</span>
              </el-menu-item>
              <el-menu-item index="/parent/public">
                <el-icon><Camera /></el-icon>
                <span>班级照片墙</span>
              </el-menu-item>
              <el-menu-item index="/parent/honor">
                <el-icon><Camera /></el-icon>
                <span>荣誉墙</span>
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
import { computed, ref, onMounted, onUnmounted } from 'vue';
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
    const isCollapse = ref(false);

    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const userInfo = computed(() => store.getters.userInfo);

    const sidebarWidth = computed(() => {
      return isCollapse.value ? '64px' : '200px';
    });

    const checkScreenSize = () => {
      isCollapse.value = window.innerWidth <= 768;
    };

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

    onMounted(() => {
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkScreenSize);
    });

    return {
      isAuthenticated,
      userInfo,
      isCollapse,
      sidebarWidth,
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
  padding: 0 15px;
  height: 60px;
}

.logo {
  font-size: 18px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
  gap: 5px;
}

.user-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info:hover {
  color: #ffd04b;
}

.sidebar {
  background-color: #545c64;
  transition: width 0.3s;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.main-content {
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
  padding: 0;
}

/* 手机端适配 */
@media (max-width: 768px) {
  .header {
    padding: 0 10px;
    height: 50px;
  }
  
  .logo {
    font-size: 16px;
  }
  
  .user-name {
    max-width: 80px;
    font-size: 14px;
  }
  
  .sidebar {
    position: fixed;
    top: 50px;
    left: 0;
    height: calc(100vh - 50px);
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .sidebar.show {
    transform: translateX(0);
  }
  
  .main-content {
    min-height: calc(100vh - 50px);
    margin-left: 0;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .header {
    padding: 0 8px;
    height: 45px;
  }
  
  .logo {
    font-size: 14px;
  }
  
  .user-name {
    max-width: 60px;
    font-size: 12px;
  }
  
  .sidebar {
    top: 45px;
    height: calc(100vh - 45px);
  }
  
  .main-content {
    min-height: calc(100vh - 45px);
  }
}
</style> 