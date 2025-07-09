import { createStore } from 'vuex';
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';

// 配置axios
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// 创建store
const store = createStore({
  state: {
    token: localStorage.getItem('token') || null,
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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
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
        
        const response = await axios.post('/auth/login', credentials);
        const { token, user } = response.data;
        
        commit('SET_TOKEN', token);
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
        
        const response = await axios.post('/auth/register', userData);
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
      commit('SET_USER', null);
      commit('SET_CLASSES', []);
      commit('SET_PHOTOS', []);
      commit('SET_USERS', []);
    },
    
    async fetchUserProfile({ commit }) {
      try {
        const response = await axios.get('/users/profile');
        commit('SET_USER', response.data);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '获取用户信息失败');
      }
    },
    
    async fetchClasses({ commit }) {
      try {
        const response = await axios.get('/classes');
        commit('SET_CLASSES', response.data);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '获取班级列表失败');
      }
    },
    
    async fetchPublicPhotos({ commit }, params = {}) {
      try {
        const response = await axios.get('/photos/public', { params });
        commit('SET_PHOTOS', response.data.photos);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '获取照片失败');
      }
    },
    
    async fetchPrivatePhotos({ commit }, params = {}) {
      try {
        const response = await axios.get('/photos/private', { params });
        commit('SET_PHOTOS', response.data.photos);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '获取照片失败');
      }
    },
    
    async uploadPhotos({ commit }, formData) {
      try {
        commit('SET_LOADING', true);
        const response = await axios.post('/photos', formData, {
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
        const response = await axios.post('/photos/like', { photoId });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '点赞失败');
      }
    },
    
    async searchPhotos({ commit }, query) {
      try {
        const response = await axios.get('/photos/search', { params: { query } });
        commit('SET_PHOTOS', response.data.photos);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || '搜索失败');
      }
    },
    
    async fetchUsers({ commit }, params = {}) {
      try {
        const response = await axios.get('/users', { params });
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
    isTeacher: (state) => state.user?.role === 'teacher',
    isParent: (state) => state.user?.role === 'parent',
    isLoading: (state) => state.loading,
    error: (state) => state.error,
    classes: (state) => state.classes,
    photos: (state) => state.photos,
    users: (state) => state.users
  }
});

// 如果有token，初始化时设置
if (store.state.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${store.state.token}`;
}

export default store; 