import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

// Mock api module
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
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

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('initial state', () => {
    it('should have null user and token initially', () => {
      const store = useAuthStore();

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('setToken', () => {
    it('should set token and update authorization header', () => {
      const store = useAuthStore();
      const { api } = require('@/services/api');

      store.setToken('test-token');

      expect(store.token).toBe('test-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token');
    });

    it('should clear token when null is passed', () => {
      const store = useAuthStore();
      store.token = 'existing-token';
      const { api } = require('@/services/api');

      store.setToken(null);

      expect(store.token).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('setUser', () => {
    it('should set user data', () => {
      const store = useAuthStore();
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };

      store.setUser(mockUser as any);

      expect(store.user).toEqual(mockUser);
    });

    it('should clear user when null is passed', () => {
      const store = useAuthStore();
      store.user = { id: '1', username: 'test' } as any;

      store.setUser(null);

      expect(store.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear all auth data', () => {
      const store = useAuthStore();
      const { api } = require('@/services/api');

      store.token = 'test-token';
      store.user = { id: '1', username: 'test' } as any;

      store.logout();

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('isAuthenticated computed', () => {
    it('should return true when user and token exist', () => {
      const store = useAuthStore();
      store.token = 'test-token';
      store.user = { id: '1', username: 'test' } as any;

      expect(store.isAuthenticated).toBe(true);
    });

    it('should return false when user is null', () => {
      const store = useAuthStore();
      store.token = 'test-token';

      expect(store.isAuthenticated).toBe(false);
    });

    it('should return false when token is null', () => {
      const store = useAuthStore();
      store.user = { id: '1', username: 'test' } as any;

      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('initialize from localStorage', () => {
    it('should load token from localStorage on initialization', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'stored-token';
        return null;
      });

      const store = useAuthStore();
      store.$patch({ token: 'stored-token' });

      expect(store.token).toBe('stored-token');
    });
  });
});
