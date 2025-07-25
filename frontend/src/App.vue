<template>
  <div id="app">
    <el-container>
      <!-- 桌面端头部 -->
      <el-header v-if="isAuthenticated && !isMobile" class="header">
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

      <!-- 移动端头部 -->
      <el-header v-if="isAuthenticated && isMobile" class="mobile-header">
        <div class="mobile-header-content">
          <h1 class="mobile-logo">🎈 幼儿园家校沟通系统</h1>
          <el-dropdown @command="handleCommand">
            <span class="mobile-user-info">
              <el-icon><User /></el-icon>
              <span class="mobile-user-name">{{ userInfo.full_name }}</span>
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
        <!-- 桌面端侧边栏 -->
        <el-aside v-if="isAuthenticated && !isMobile" class="sidebar" :width="sidebarWidth">
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

      <!-- 移动端底部导航栏 -->
      <div v-if="isAuthenticated && isMobile" class="mobile-bottom-nav">
        <!-- 家长端导航 -->
        <template v-if="userInfo.role === 'parent'">
          <div 
            class="nav-item" 
            :class="{ active: $route.path === '/parent/photos' }"
            @click="$router.push('/parent/photos')"
          >
            <el-icon><Picture /></el-icon>
            <span>孩子照片</span>
          </div>
          
          <div 
            class="nav-item" 
            :class="{ active: $route.path === '/parent/public' }"
            @click="$router.push('/parent/public')"
          >
            <el-icon><Camera /></el-icon>
            <span>班级照片</span>
          </div>
          
          <div 
            class="nav-item" 
            :class="{ active: $route.path === '/parent' }"
            @click="$router.push('/parent')"
          >
            <el-icon><House /></el-icon>
            <span>工作台</span>
          </div>
        </template>

        <!-- 教师端导航 -->
        <template v-if="userInfo.role === 'teacher'">
          <div 
            class="nav-item" 
            :class="{ active: $route.path === '/teacher' }"
            @click="$router.push('/teacher')"
          >
            <el-icon><House /></el-icon>
            <span>工作台</span>
          </div>
          
          <div 
            class="nav-item upload-btn" 
            :class="{ active: $route.path === '/teacher/upload' }"
            @click="$router.push('/teacher/upload')"
          >
            <div class="upload-icon-wrapper">
              <el-icon><Plus /></el-icon>
            </div>
            <span>上传照片</span>
          </div>
          
          <div 
            class="nav-item" 
            :class="{ active: $route.path === '/teacher/photos' }"
            @click="$router.push('/teacher/photos')"
          >
            <el-icon><Picture /></el-icon>
            <span>相册</span>
          </div>
          
          <div 
            class="nav-item" 
            :class="{ active: $route.path === '/teacher/class' }"
            @click="$router.push('/teacher/class')"
          >
            <el-icon><School /></el-icon>
            <span>班级</span>
          </div>
        </template>
      </div>
    </el-container>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { Link, Plus } from '@element-plus/icons-vue';

export default {
  name: 'App',
  components: {
    Link,
    Plus
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const isCollapse = ref(false);
    const isMobile = ref(false);

    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const userInfo = computed(() => store.getters.userInfo);

    const sidebarWidth = computed(() => {
      return isCollapse.value ? '64px' : '200px';
    });

    const checkScreenSize = () => {
      const width = window.innerWidth;
      isCollapse.value = width <= 768;
      isMobile.value = width <= 768;
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
      isMobile,
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

/* 移动端头部样式 */
.mobile-header {
  background-color: #409eff;
  color: white;
  padding: 0 15px;
  height: 50px;
  display: flex;
  align-items: center;
}

.mobile-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.mobile-logo {
  font-size: 16px;
  font-weight: bold;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
  gap: 5px;
}

.mobile-user-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

/* 移动端底部导航栏 */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #ffffff;
  border-top: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  color: #909399;
}

.nav-item:hover {
  color: #409eff;
}

.nav-item.active {
  color: #409eff;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: #409eff;
  border-radius: 1px;
}

.nav-item .el-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.nav-item span {
  font-size: 12px;
  font-weight: 500;
}

/* 教师端上传按钮特殊样式 */
.upload-btn {
  position: relative;
}

.upload-icon-wrapper {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.upload-icon-wrapper .el-icon {
  font-size: 24px;
  color: white;
  margin-bottom: 0;
}

.upload-btn:hover .upload-icon-wrapper {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.upload-btn.active .upload-icon-wrapper {
  background: linear-gradient(135deg, #67c23a, #409eff);
}

/* 手机端适配 */
@media (max-width: 768px) {
  .header {
    display: none;
  }
  
  .sidebar {
    display: none;
  }
  
  .main-content {
    min-height: calc(100vh - 50px - 60px);
    margin-left: 0;
    padding-bottom: 60px;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .mobile-header {
    padding: 0 10px;
    height: 45px;
  }
  
  .mobile-logo {
    font-size: 14px;
  }
  
  .mobile-user-name {
    max-width: 60px;
    font-size: 12px;
  }
  
  .mobile-bottom-nav {
    height: 55px;
  }
  
  .nav-item .el-icon {
    font-size: 18px;
  }
  
  .nav-item span {
    font-size: 11px;
  }
  
  .upload-icon-wrapper {
    width: 45px;
    height: 45px;
  }
  
  .upload-icon-wrapper .el-icon {
    font-size: 22px;
  }
  
  .main-content {
    min-height: calc(100vh - 45px - 55px);
    padding-bottom: 55px;
  }
}
</style> 