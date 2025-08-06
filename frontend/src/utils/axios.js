import axios from 'axios';

// 动态获取API基础URL
function getApiBaseUrl() {
  // 如果是开发环境，使用代理
  if (process.env.NODE_ENV === 'development') {
    // 本地访问使用代理，避免网络检查延迟
    return '/api';
  }
  
  // 生产环境使用环境变量或默认值
  return process.env.VUE_APP_API_URL;
}

// 防止重复刷新的标志
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// 创建axios实例
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  withCredentials: true
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 添加token到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加调试信息（减少日志输出）
    if (process.env.NODE_ENV === 'development' && process.env.VUE_APP_DEBUG === 'true') {
      console.log('API请求:', config.method?.toUpperCase(), config.url);
      console.log('API基础URL:', config.baseURL);
    }
    
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    console.error('响应错误:', error);
    console.error('错误详情:', error.response?.data);
    
    // 处理401未授权错误 - 尝试自动刷新token
    if (error.response?.status === 401) {
      console.log('Token无效或过期，尝试自动刷新');
      
      // 检查是否有refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('没有refresh token，跳转登录页面');
        // 清除认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // 跳转到登录页面
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // 防止重复刷新
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          error.config.headers.Authorization = `Bearer ${token}`;
          return api(error.config);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      error.config._retry = true;
      isRefreshing = true;
      
      try {
        // 尝试刷新token
        console.log('开始刷新token...');
        const refreshResponse = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
          refreshToken: refreshToken
        });
        
        const { accessToken, user } = refreshResponse.data;
        
        // 更新本地存储
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // 更新axios默认headers
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        console.log('Token刷新成功，重试原请求');
        
        // 处理队列中的请求
        processQueue(null, accessToken);
        
        // 重试原请求
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return api(error.config);
        
      } catch (refreshError) {
        console.log('Token刷新失败，跳转登录页面');
        // 处理队列中的请求
        processQueue(refreshError, null);
        // 刷新失败，清除所有认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // 跳转到登录页面
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 