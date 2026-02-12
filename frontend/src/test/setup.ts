import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// 全局 mock 配置
config.global.mocks = {
  $t: (key: string) => key,
};

// Element Plus 按需导入 mock
vi.mock('element-plus', async () => ({
  ElButton: { name: 'ElButton', template: '<button><slot /></button>' },
  ElInput: { name: 'ElInput', template: '<input />' },
  ElForm: { name: 'ElForm', template: '<form><slot /></form>' },
  ElFormItem: { name: 'ElFormItem', template: '<div><slot /></div>' },
  ElCard: { name: 'ElCard', template: '<div class="el-card"><slot /></div>' },
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  ElMessageBox: {
    confirm: vi.fn(() => Promise.resolve()),
  },
}));

// Vue Router mock
vi.mock('vue-router', () => ({
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
  useRoute: vi.fn(() => ({ path: '/', query: {}, params: {} })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    go: vi.fn(),
  })),
}));

// Pinia mock
vi.mock('pinia', () => ({
  createPinia: vi.fn(() => ({
    install: vi.fn(),
  })),
  defineStore: vi.fn(),
}));

// API mock
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

// IntersectionObserver mock
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
