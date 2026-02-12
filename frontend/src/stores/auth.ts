import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { authApi, type AuthResponse, type User as ApiUser } from '@/api/auth';

interface User {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  avatarUrl?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export const useAuthStore = defineStore('auth', () => {
  // Safely parse localStorage with try-catch
  const getToken = () => {
    try {
      return localStorage.getItem('token') || '';
    } catch {
      return '';
    }
  };

  const getUser = (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const token = ref<string>(getToken());
  const user = ref<User | null>(getUser());
  const isSidebarCollapsed = ref<boolean>(false); // Default to false

  const isAuthenticated = computed(() => !!token.value);
  const currentUser = computed(() => user.value || { username: '用户' } as User);

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  function clearAuth() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed.value));
  }

  async function login(credentials: LoginCredentials) {
    try {
      const response = await authApi.login(credentials) as any;
      setAuth(response.data.token, response.data.user);
      return response;
    } catch (error: any) {
      clearAuth();
      throw error;
    }
  }

  async function register(credentials: RegisterCredentials) {
    try {
      const response = await authApi.register(credentials) as any;
      setAuth(response.data.token, response.data.user);
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async function logout() {
    // TODO: 实现登出API调用
    clearAuth();
  }

  async function fetchProfile() {
    try {
      const response = await authApi.getProfile();
      user.value = response;
      localStorage.setItem('user', JSON.stringify(response));
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    currentUser,
    isSidebarCollapsed,
    setAuth,
    clearAuth,
    toggleSidebar,
    login,
    register,
    logout,
    fetchProfile,
  };
});
