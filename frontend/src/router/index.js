import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login2',
    name: 'Login2',
    component: () => import('../views/Login2.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  // 教师端路由
  {
    path: '/teacher',
    name: 'TeacherDashboard',
    component: () => import('../views/teacher/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/upload',
    name: 'TeacherUpload',
    component: () => import('../views/teacher/PhotoUpload.vue'),
    meta: { requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/class',
    name: 'TeacherClass',
    component: () => import('../views/teacher/ClassManagement.vue'),
    meta: { requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/users',
    name: 'TeacherUsers',
    component: () => import('../views/teacher/UserManagement.vue'),
    meta: { requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/photos',
    name: 'TeacherPhotos',
    component: () => import('../views/teacher/PhotoManagement.vue'),
    meta: { requiresAuth: true, role: 'teacher' }
  },
  // 家长端路由
  {
    path: '/parent',
    name: 'ParentDashboard',
    component: () => import('../views/parent/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'parent' }
  },
  {
    path: '/parent/photos',
    name: 'ParentPhotos',
    component: () => import('../views/parent/PhotoAlbums.vue'),
    meta: { requiresAuth: true, role: 'parent' }
  },

  {
    path: '/parent/binding',
    name: 'ParentBinding',
    component: () => import('../views/parent/ChildBinding.vue'),
    meta: { requiresAuth: true, role: 'parent' }
  },
  {
    path: '/parent/public',
    name: 'ParentPublic',
    component: () => import('../views/parent/PublicPhotos.vue'),
    meta: { requiresAuth: true, role: 'parent' }
  },
  {
    path: '/parent/honor',
    name: 'ParentHonor',
    component: () => import('../views/parent/HonorBoard.vue'),
    meta: { requiresAuth: true, role: 'parent' }
  },

  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated;
  // 优先使用mapped_role，兼容role字段
  const userInfo = store.getters.userInfo;
  const userRole = userInfo?.mapped_role || userInfo?.role;

  // 添加调试信息
  console.log('路由守卫 - 目标路径:', to.path);
  console.log('路由守卫 - 是否已认证:', isAuthenticated);
  console.log('路由守卫 - 用户角色:', userRole);
  console.log('路由守卫 - 用户信息:', userInfo);
  console.log('路由守卫 - 用户mapped_role:', userInfo?.mapped_role);
  console.log('路由守卫 - 用户role:', userInfo?.role);

  // 检查是否需要认证
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('路由守卫 - 需要认证但未认证，跳转到登录页');
    next('/login');
    return;
  }

  // 检查角色权限
  if (to.meta.role && userRole !== to.meta.role) {
    console.log('路由守卫 - 角色不匹配，重定向');
    // 根据角色重定向到对应的首页
    if (userRole === 'teacher') {
      next('/teacher');
    } else if (userRole === 'parent') {
      next('/parent');
    } else {
      next('/login');
    }
    return;
  }

  // 已登录用户访问登录页面，重定向到对应首页
  if (isAuthenticated && (to.path === '/login' || to.path === '/login2')) {
    console.log('路由守卫 - 已登录用户访问登录页，重定向');
    if (userRole === 'teacher') {
      next('/teacher');
    } else if (userRole === 'parent') {
      next('/parent');
    } else {
      next('/');
    }
    return;
  }

  console.log('路由守卫 - 允许访问');
  next();
});

export default router; 