import axios from 'axios';

// 动态获取API基础URL
function getApiBaseUrl() {
  // 如果是开发环境，使用代理
  if (process.env.NODE_ENV === 'development') {
    // 检查当前访问的域名
    const currentHost = window.location.hostname;
    
    // 如果是本地网络访问，直接使用服务器IP
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      // 使用当前访问的IP地址，但端口改为3000（后端端口）
      return `http://${currentHost}:3000/api`;
    }
    
    // 本地访问使用代理
    return '/api';
  }
  
  // 生产环境使用环境变量或默认值
  return process.env.VUE_APP_API_URL || '/api';
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
    
    // 添加调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('API请求:', config.method?.toUpperCase(), config.url);
      console.log('API基础URL:', config.baseURL);
      console.log('当前访问地址:', window.location.href);
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
  error => {
    console.error('响应错误:', error);
    console.error('错误详情:', error.response?.data);
    
    // 处理401未授权错误
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api; 