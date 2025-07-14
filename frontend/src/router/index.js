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
  {
    path: '/test-input',
    name: 'TestInput',
    component: () => import('../views/TestInput.vue'),
    meta: { requiresAuth: false }
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
  const userRole = store.getters.userInfo?.role;

  // 检查是否需要认证
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
    return;
  }

  // 检查角色权限
  if (to.meta.role && userRole !== to.meta.role) {
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
  if (isAuthenticated && to.path === '/login') {
    if (userRole === 'teacher') {
      next('/teacher');
    } else if (userRole === 'parent') {
      next('/parent');
    } else {
      next('/');
    }
    return;
  }

  next();
});

export default router; 