import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type { Router } from 'vue-router';

interface User {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  avatarUrl?: string;
  targetExam?: string;
}

interface LoginRequest {
  username: string;
  password: string;
  remember?: boolean;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

/**
 * 认证管理 Composable
 * 处理登录、注册、登出等功能
 */
export function useAuth() {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('mistakery_token'));
  const isAuthenticated = computed(() => !!user.value && !!token.value);

  /**
   * 初始化认证状态
   */
  async function initialize() {
    const storedToken = localStorage.getItem('mistakery_token');
    if (storedToken) {
      token.value = storedToken;
      try {
        await fetchProfile();
      } catch (error) {
        // Token 无效，清除
        logout();
      }
    }
  }

  /**
   * 登录
   */
  async function login(data: LoginRequest) {
    const response = await api.post<AuthResponse>('/auth/login', data);

    // 保存 token
    token.value = response.data.token;
    localStorage.setItem('mistakery_token', response.data.token);

    // 保存用户信息
    user.value = response.data.user;

    // 设置 axios 默认 token
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

    return response.data;
  }

  /**
   * 注册
   */
  async function register(data: RegisterRequest) {
    const response = await api.post<AuthResponse>('/auth/register', data);

    // 注册成功后自动登录
    token.value = response.data.token;
    localStorage.setItem('mistakery_token', response.data.token);

    user.value = response.data.user;

    // 设置 axios 默认 token
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

    return response.data;
  }

  /**
   * 登出
   */
  async function logout() {
    try {
      // 调用登出 API（如果有）
      await api.post('/auth/logout');
    } catch (error) {
      // 忽略错误
    } finally {
      // 清除本地存储
      user.value = null;
      token.value = null;
      localStorage.removeItem('mistakery_token');
      delete api.defaults.headers.common['Authorization'];
    }
  }

  /**
   * 获取用户资料
   */
  async function fetchProfile() {
    const response = await api.get<User>('/auth/profile');
    user.value = response.data;
    return response.data;
  }

  /**
   * 更新用户资料
   */
  async function updateProfile(data: {
    nickname?: string;
    targetExam?: string;
  }) {
    const response = await api.put<User>('/user/profile', data);
    user.value = response.data;
    return response.data;
  }

  /**
   * 更新设置
   */
  async function updateSettings(data: {
    theme?: string;
    fontSize?: number;
    autoNext?: boolean;
    notificationsEnabled?: boolean;
  }) {
    const response = await api.put('/user/settings', data);
    return response.data;
  }

  /**
   * 上传头像
   */
  async function uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post<{ avatarUrl: string }>('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (user.value) {
      user.value.avatarUrl = response.data.avatarUrl;
    }

    return response.data.avatarUrl;
  }

  /**
   * 发送重置密码邮件
   */
  async function sendResetEmail(email: string) {
    return api.post('/auth/password/reset', { email });
  }

  /**
   * 重置密码
   */
  async function resetPassword(token: string, password: string) {
    return api.post('/auth/password/reset/confirm', { token, password });
  }

  /**
   * 刷新 token
   */
  async function refreshToken() {
    const storedToken = localStorage.getItem('mistakery_token');
    if (!storedToken) {
      throw new Error('No token available');
    }

    const response = await api.post<{ token: string }>('/auth/refresh', {
      token: storedToken,
    });

    token.value = response.data.token;
    localStorage.setItem('mistakery_token', response.data.token);

    // 设置 axios 默认 token
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

    return response.data.token;
  }

  /**
   * 检查路由权限
   */
  function requiresAuth(): boolean {
    return !!token.value;
  }

  return {
    user,
    token,
    isAuthenticated,
    initialize,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    updateSettings,
    uploadAvatar,
    sendResetEmail,
    resetPassword,
    refreshToken,
    requiresAuth,
  };
}
