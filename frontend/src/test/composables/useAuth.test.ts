import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '@/composables/useAuth';
import { api } from '@/services/api';

// Mock api module
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('initial state', () => {
    it('should have null user and token initially', () => {
      const { user, token } = useAuth();

      expect(user.value).toBeNull();
      expect(token.value).toBeNull();
    });

    it('should have isAuthenticated as false when no user or token', () => {
      const { isAuthenticated } = useAuth();

      expect(isAuthenticated.value).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully and save token', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            nickname: 'Test User',
          },
          token: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const { login, user, token } = useAuth();
      const result = await login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse.data);
      expect(user.value).toEqual(mockResponse.data.user);
      expect(token.value).toBe('mock-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-access-token');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer mock-access-token');
    });

    it('should save refresh token when remember is true', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', username: 'testuser', email: 'test@example.com' },
          token: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const { login } = useAuth();
      await login({
        username: 'testuser',
        password: 'password123',
        remember: true,
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
    });
  });

  describe('register', () => {
    it('should register successfully and auto-login', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            username: 'newuser',
            email: 'new@example.com',
            nickname: 'New User',
          },
          token: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const { register, user, token } = useAuth();
      const result = await register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse.data);
      expect(user.value).toEqual(mockResponse.data.user);
      expect(token.value).toBe('mock-access-token');
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
    });
  });

  describe('logout', () => {
    it('should clear user data and tokens', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };

      vi.mocked(api.post).mockResolvedValue({ data: {} });

      const { user, token, logout } = useAuth();
      user.value = mockUser as any;
      token.value = 'mock-token';

      await logout();

      expect(user.value).toBeNull();
      expect(token.value).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should handle logout API errors gracefully', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      const { user, token, logout } = useAuth();
      user.value = { id: '1', username: 'test' } as any;
      token.value = 'mock-token';

      await logout();

      // Should still clear local data even if API call fails
      expect(user.value).toBeNull();
      expect(token.value).toBeNull();
    });
  });

  describe('fetchProfile', () => {
    it('should fetch user profile', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        nickname: 'Test User',
      };

      vi.mocked(api.get).mockResolvedValue({ data: { user: mockUser } });

      const { fetchProfile, user } = useAuth();
      const result = await fetchProfile();

      expect(result).toEqual(mockUser);
      expect(user.value).toEqual(mockUser);
      expect(api.get).toHaveBeenCalledWith('/auth/profile');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        nickname: 'Updated Name',
        targetExam: 'gaokao',
      };

      vi.mocked(api.put).mockResolvedValue({ data: { user: updatedUser } });

      const { updateProfile, user } = useAuth();
      const result = await updateProfile({
        nickname: 'Updated Name',
        targetExam: 'gaokao',
      });

      expect(result).toEqual(updatedUser);
      expect(user.value).toEqual(updatedUser);
      expect(api.put).toHaveBeenCalledWith('/user/profile', {
        nickname: 'Updated Name',
        targetExam: 'gaokao',
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'mock-refresh-token';
        return null;
      });

      const mockResponse = {
        data: {
          token: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 3600,
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const { token, refreshToken } = useAuth();
      const result = await refreshToken();

      expect(result).toEqual(mockResponse.data.token);
      expect(token.value).toBe('new-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-access-token');
    });

    it('should throw error when no refresh token available', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { refreshToken } = useAuth();

      await expect(refreshToken()).rejects.toThrow('No refresh token available');
    });
  });
});
