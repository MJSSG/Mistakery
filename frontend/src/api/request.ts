import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建axios实例
const service: any = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
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

export default service;

// 通用请求方法
export function request<T = any>(config: any): Promise<T> {
  return service.request<T>(config);
}

export function get<T = any>(url: string, config?: any): Promise<T> {
  return service.get<T>(url, config);
}

export function post<T = any>(url: string, data?: any, config?: any): Promise<T> {
  return service.post<T>(url, data, config);
}

export function put<T = any>(url: string, data?: any, config?: any): Promise<T> {
  return service.put<T>(url, data, config);
}

export function del<T = any>(url: string, config?: any): Promise<T> {
  return service.delete<T>(url, config);
}
