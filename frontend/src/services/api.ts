import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建 axios 实例
const api: any = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('mistakery_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: any) => {
    return response.data;
  },
  (error: any) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录');
          localStorage.removeItem('mistakery_token');
          localStorage.removeItem('mistakery_user');
          window.location.href = '/login';
          break;
        case 403:
          ElMessage.error('没有权限访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误');
          break;
        default:
          ElMessage.error(response.data?.message || '请求失败');
      }
    } else {
      ElMessage.error('网络连接失败');
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;
