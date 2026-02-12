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
      const token = localStorage.getItem('token') || '';
      console.log('[Auth Store] getToken from localStorage:', !!token);
      return token;
    } catch {
      console.error('[Auth Store] getToken error:', arguments);
      return '';
    }
  };

  const getUser = (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      console.log('[Auth Store] getUser from localStorage:', !!userStr);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      console.error('[Auth Store] getUser error:', arguments);
      return null;
    }
  };

  const token = ref<string>(getToken());
  const user = ref<User | null>(getUser());
  const isSidebarCollapsed = ref<boolean>(false); // Default to false

  const isAuthenticated = computed(() => {
    const auth = !!token.value;
    console.log('[Auth Store] isAuthenticated computed:', auth);
    return auth;
  });
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
      console.log('[Auth Store] login response:', response);
      console.log('[Auth Store] response.data:', response.data);
      // Backend returns { code: 200, data: { user, token } }
      // Response interceptor returns response.data, so we have { code, data, message }
      const token = response.data?.token || response.token;
      const user = response.data?.user || response.user;
      console.log('[Auth Store] extracted token:', !!token, 'user:', !!user);
      setAuth(token, user);
      return response;
    } catch (error: any) {
      clearAuth();
      throw error;
    }
  }

  async function register(credentials: RegisterCredentials) {
    try {
      const response = await authApi.register(credentials) as any;
      console.log('[Auth Store] register response:', response);
      console.log('[Auth Store] response.data:', response.data);
      // Backend returns { code: 200, data: { user, token } }
      // Response interceptor returns response.data, so we have { code, data, message }
      const token = response.data?.token || response.token;
      const user = response.data?.user || response.user;
      console.log('[Auth Store] extracted token:', !!token, 'user:', !!user);
      setAuth(token, user);
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
