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
    
    // 处理401未授权错误 - 直接跳转登录，不使用refresh token
    if (error.response?.status === 401) {
      console.log('Token无效或过期，跳转登录页面');
      
      // 清除认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // 跳转到登录页面
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api; 