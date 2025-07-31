import { createStore } from 'vuex';
import api from '../utils/axios';

const store = createStore({
  state: {
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
    error: null,
    classes: [],
    photos: [],
    users: []
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      }
    },
    
    SET_REFRESH_TOKEN(state, refreshToken) {
      state.refreshToken = refreshToken;
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      } else {
        localStorage.removeItem('refreshToken');
      }
    },
    
    SET_USER(state, user) {
      state.user = user;
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    
    SET_ERROR(state, error) {
      state.error = error;
    },
    
    SET_CLASSES(state, classes) {
      state.classes = classes;
    },
    
    SET_PHOTOS(state, photos) {
      state.photos = photos;
    },
    
    SET_USERS(state, users) {
      state.users = users;
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        console.log('尝试登录，API地址:', api.defaults.baseURL);
        
        const response = await api.post('/auth/login', credentials);
        const { accessToken, refreshToken, user } = response.data;
        
        commit('SET_TOKEN', accessToken);
        commit('SET_REFRESH_TOKEN', refreshToken);
        commit('SET_USER', user);
        
        return response.data;
      } catch (error) {
        const message = error.response?.data?.error || '登录失败';
        commit('SET_ERROR', message);
        throw new Error(message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async login2({ commit }, credentials) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        // console.log('尝试外部登录，API地址:', api.defaults.baseURL);
        
        const response = await api.post('/auth/login2', credentials);
        // 接口返回 message, accessToken, refreshToken, user 四个字段
        const { accessToken, user } = response.data;
        
        commit('SET_TOKEN', accessToken);
        commit('SET_REFRESH_TOKEN', null); // 外部系统没有refresh token
        commit('SET_USER', user);
        
        return response.data;
      } catch (error) {
        const message = error.response?.data?.error || '登录失败';
        commit('SET_ERROR', message);
        throw new Error(message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async phoneLogin({ commit }, credentials) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        // console.log('尝试手机号登录，API地址:', api.defaults.baseURL);
        console.log('查看手机号登录的参数:', credentials);
        
        const response = await api.post('/auth/phoneLogin', credentials);
        const { accessToken, user } = response.data;
        
        commit('SET_TOKEN', accessToken);
        commit('SET_REFRESH_TOKEN', null); // 外部系统没有refresh token
        commit('SET_USER', user);
        
        return response.data;
      } catch (error) {
        const message = error.response?.data?.error || '登录失败';
        commit('SET_ERROR', message);
        throw new Error(message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async register({ commit }, userData) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        const response = await api.post('/auth/register', userData);
        return response.data;
      } catch (error) {
        const message = error.response?.data?.error || '注册失败';
        commit('SET_ERROR', message);
        throw new Error(message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    logout({ commit }) {
      commit('SET_TOKEN', null);
      commit('SET_REFRESH_TOKEN', null); //登出后清除刷新令牌
      commit('SET_USER', null);
      commit('SET_CLASSES', []);
      commit('SET_PHOTOS', []);
      commit('SET_USERS', []);
    },
    
    async refreshToken({ commit, state }) {
      try {
        const refreshToken = state.refreshToken;
        if (!refreshToken) {
          throw new Error('没有刷新令牌');
        }

        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, user } = response.data;
        
        commit('SET_TOKEN', accessToken);
        commit('SET_USER', user);
        
        return { accessToken, user };
      } catch (error) {
        // 刷新失败，清除所有认证信息
        commit('SET_TOKEN', null);
        commit('SET_REFRESH_TOKEN', null);
        commit('SET_USER', null);
        throw new Error(error.response?.data?.error || '刷新令牌失败');
      }
    },
    
    async fetchUserProfile({ commit }) {
      try {
        const response = await api.get('/users/profile');
        commit('SET_USER', response.data);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '获取用户信息失败');
      }
    },
    
    async fetchClasses({ commit }) {
      try {
        const response = await api.get('/classes');
        commit('SET_CLASSES', response.data);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '获取班级列表失败');
      }
    },
    
    async fetchPublicPhotos({ commit }, params = {}) {
      try {
        const response = await api.get('/photos/public', { params });
        commit('SET_PHOTOS', response.data.photos);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '获取照片失败');
      }
    },
    
    async fetchPrivatePhotos({ commit }, params = {}) {
      try {
        const response = await api.get('/photos/private', { params });
        commit('SET_PHOTOS', response.data.photos);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '获取照片失败');
      }
    },
    
    async uploadPhotos({ commit }, formData) {
      try {
        commit('SET_LOADING', true);
        const response = await api.post('/photos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '上传照片失败');
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async likePhoto(_, photoId) {
      try {
        const response = await api.post('/photos/like', { photoId });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '点赞失败');
      }
    },
    
    async searchPhotos({ commit }, query) {
      try {
        const response = await api.get('/photos/search', { params: { query } });
        commit('SET_PHOTOS', response.data.photos);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '搜索失败');
      }
    },
    
    async fetchUsers({ commit }, params = {}) {
      try {
        const response = await api.get('/users', { params });
        commit('SET_USERS', response.data);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '获取用户列表失败');
      }
    }
  },
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    userInfo: (state) => state.user,
    // 优先使用mapped_role，兼容role字段
    isTeacher: (state) => (state.user?.mapped_role || state.user?.role) === 'teacher',
    isParent: (state) => (state.user?.mapped_role || state.user?.role) === 'parent',
    isLoading: (state) => state.loading,
    error: (state) => state.error,
    classes: (state) => state.classes,
    photos: (state) => state.photos,
    users: (state) => state.users
  }
});

// 如果本地有token，初始化时设置
if (store.state.token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${store.state.token}`;
}

export default store; 
