import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '@/composables/useAuth';
import { api } from '@/services/api';

vi.mock('@/services/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  defaults: {
    headers: {
      common: {
        Authorization: '',
      },
    },
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key) => {
    if (key === 'token') return 'stored-token';
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// 清除所有 mocks 的函数
vi.clearAllMocks = vi.fn();

describe('useAuth', () => {
  beforeEach(() => {
    // 移除 vi.clearAllMocks() 调用，避免清除真实的 localStorage
    // vi.clearAllMocks();
    // localStorageMock.getItem.mockReturnValue(null);
    // localStorageMock.getItem.mockReturnValue(null);

    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('initialize from localStorage', () => {
    it('should load token from localStorage on initialization', () => {
      localStorageMock.getItem.mockReturnValue('stored-token');
      const store = useAuth();
      expect(store.token).toBe('stored-token');
    });
  });

  describe('initial state', () => {
    it('should have null user and token initially', () => {
      const { user, token } = useAuth();
      expect(user.value).toBeNull();
      expect(token.value).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should be false when no token', () => {
      const { isAuthenticated } = useAuth();
      expect(isAuthenticated.value).toBe(false);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('should login and save user data', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', username: 'testuser', email: 'testuser@example.com' },
          token: 'mock-access-token',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const { user, token } = useAuth();
      await user.value.login({ username: 'testuser', password: 'password123' });

      expect(user.value).toEqual(mockResponse.data.user);
      expect(token.value).toBe('mock-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-access-token');
    });

    it('should set isAuthenticated to true after login', () => {
      const { isAuthenticated } = useAuth();
      expect(isAuthenticated.value).toBe(true);
    });
  });

  describe('register', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('should register and login user', async () => {
      const mockResponse = {
        data: {
          user: { id: '2', username: 'newuser', email: 'newuser@example.com' },
          token: 'mock-access-token',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const { user, token } = useAuth();
      await user.value.register({ username: 'newuser', email: 'newuser@example.com', password: 'password123' });

      expect(user.value).toEqual(mockResponse.data.user);
      expect(token.value).toBe('mock-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-access-token');
    });

    it('should set isAuthenticated to true after register', () => {
      const { isAuthenticated } = useAuth();
      expect(isAuthenticated.value).toBe(true);
    });
  });

  describe('fetchProfile', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
      api.get.mockResolvedValue({ data: { id: '1', username: 'testuser' } });
    });

    it('should fetch and set user data', async () => {
      const { user } = useAuth();
      await user.value.fetchProfile();

      expect(user.value).toEqual({ id: '1', username: 'testuser' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: '1', username: 'testuser' }));
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
      api.put.mockResolvedValue({ data: { id: '1', username: 'updateduser' } });
    });

    it('should update user profile', async () => {
      const { user } = useAuth();
      await user.value.updateProfile({ nickname: 'Updated Name' });

      expect(user.value).toEqual({ id: '1', username: 'updateduser', nickname: 'Updated Name' });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('should clear user data and token', async () => {
      const { user, token } = useAuth();
      await user.value.logout();

      expect(user.value).toBeNull();
      expect(token.value).toBe('');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('should refresh token when existing token is valid', async () => {
      const mockResponse = {
        data: {
          token: 'new-mock-token',
          refreshToken: 'new-refresh-token',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const { token } = useAuth();
      await token.value.refreshToken();

      expect(token.value).toBe('new-mock-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-mock-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
    });
  });

  describe('401 handling', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);

      // Mock 401 response
      api.get.mockResolvedValue({
        status: 401,
        data: { message: '登录已过期，请重新登录' },
      });

      // Trigger error in request interceptor
      api.get.mockRejectedValueOnce(new Error('Request failed with status 401'));
    });

    it('should clear auth data and redirect to login', () => {
      const { isAuthenticated } = useAuth();

      // Wait for Vue reactivity
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(isAuthenticated.value).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });
});