<template>
  <div id="app">
    <!-- 未登录时直接显示路由内容 -->
    <router-view v-if="!isAuthenticated" />
    
    <!-- 登录中或用户信息加载中 -->
    <div v-else-if="isAuthenticated && !userInfo" class="loading-container">
      <el-loading-spinner />
      <p>正在加载用户信息...</p>
    </div>
    
    <!-- 已登录时显示完整布局 -->
    <el-container v-else-if="isAuthenticated && userInfo">
      <!-- 桌面端头部 -->
      <el-header v-if="!isMobile" class="header">
        <div class="header-left">
          <h1 class="logo">幼儿园成长相册</h1>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              <span class="user-name">{{ userInfo && userInfo.full_name ? userInfo.full_name : '用户' }}</span>
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
      <el-header v-if="isMobile" class="mobile-header">
        <div class="mobile-header-content">
          <h1 class="mobile-logo">幼儿园成长相册</h1>
          <el-dropdown @command="handleCommand">
            <span class="mobile-user-info">
              <el-icon><User /></el-icon>
              <span class="mobile-user-name">{{ userInfo && userInfo.full_name ? userInfo.full_name : '用户' }}</span>
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
        <el-aside v-if="!isMobile" class="sidebar" :width="sidebarWidth">
          <el-menu
            :default-active="$route.path"
            class="sidebar-menu"
            router
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b"
            :collapse="isCollapse"
          >
            <template v-if="userInfo && userInfo.role === 'teacher'">
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
            
            <template v-if="userInfo && userInfo.role === 'parent'">
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

        <el-main class="main-content" :style="mainContentStyle">
          <router-view />
        </el-main>
      </el-container>

      <!-- 移动端底部导航栏 -->
      <div v-if="isMobile" class="mobile-bottom-nav">
        <!-- 家长端导航 -->
        <template v-if="userInfo && userInfo.role === 'parent'">
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
        <template v-if="userInfo && userInfo.role === 'teacher'">
          <div 
            class="nav-item" 
            :class="{ active: $route.path === '/teacher' }"
            @click="$router.push('/teacher')"
          >
            <el-icon><House /></el-icon>
            <span>工作台</span>
          </div>
          
          <div 
            class="nav-item" 
            :class="{ active: $route.path === '/teacher/upload' }"
            @click="$router.push('/teacher/upload')"
          >
            <el-icon><Camera /></el-icon>
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
import { Link, Camera } from '@element-plus/icons-vue';

export default {
  name: 'App',
  components: {
    Link,
    Camera
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

    const mainContentStyle = computed(() => {
      return {
        marginLeft: isCollapse.value ? '64px' : '200px',
        marginTop: '60px',
        transition: 'margin-left 0.3s'
      };
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
          router.push('/login');
          store.dispatch('logout');
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
      mainContentStyle,
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
  
  /* 自定义Element Plus主题色 */
  --el-color-primary: #57B9FF;
  --el-color-primary-light-3: #90D5FF;
  --el-color-primary-light-5: #A8DDFF;
  --el-color-primary-light-7: #C0E5FF;
  --el-color-primary-light-8: #CCE9FF;
  --el-color-primary-light-9: #E6F4FF;
  --el-color-primary-dark-2: #77B1D4;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.loading-container p {
  margin-top: 20px;
  color: #666;
  font-size: 16px;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #57B9FF;
  color: white;
  padding: 0 15px;
  height: 60px;
  box-shadow: 0 2px 8px rgba(87, 185, 255, 0.2);
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
  color: #90D5FF;
}

.sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  background-color: #517891;
  transition: width 0.3s;
  z-index: 999;
  overflow-y: auto;
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
  background-color: #57B9FF;
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
  padding: 5px;
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
  color: #57B9FF;
}

.nav-item.active {
  color: #57B9FF;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: #57B9FF;
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
  background: linear-gradient(135deg, #57B9FF, #77B1D4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  box-shadow: 0 4px 12px rgba(87, 185, 255, 0.3);
  transition: all 0.3s ease;
}

.upload-icon-wrapper .el-icon {
  font-size: 24px;
  color: white;
  margin-bottom: 0;
}

.upload-btn:hover .upload-icon-wrapper {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(87, 185, 255, 0.4);
}

.upload-btn.active .upload-icon-wrapper {
  background: linear-gradient(135deg, #77B1D4, #57B9FF);
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
    margin-left: 0 !important;
    margin-top: 0 !important;
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