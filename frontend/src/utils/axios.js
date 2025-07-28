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
  async error => {
    console.error('响应错误:', error);
    console.error('错误详情:', error.response?.data);
    
    // 处理401未授权错误
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      // 如果是token过期，尝试刷新
      if (errorCode === 'TOKEN_EXPIRED') {
        try {
          // 获取store实例
          const store = JSON.parse(localStorage.getItem('vuex') || '{}');
          const refreshToken = store.refreshToken || localStorage.getItem('refreshToken');
          
          if (refreshToken) {
            // 尝试刷新token
            const refreshResponse = await axios.post('/api/auth/refresh', { refreshToken });
            const { accessToken, user } = refreshResponse.data;
            
            // 更新localStorage
            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            // 更新axios默认头
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // 重试原始请求
            const originalRequest = error.config;
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('刷新token失败:', refreshError);
        }
      }
      
      // 刷新失败或没有refreshToken，清除认证信息并跳转登录
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api; 