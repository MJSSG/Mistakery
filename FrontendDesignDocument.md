# Mistakery 前端设计文档

## 1. 概述
本文档概述了 Mistakery 平台的前端架构和实施策略。该设计强调模块化、可重用性和关注点分离，同时保持所有功能的一致用户体验。

## 2. 技术栈
| 类别 | 技术 |
|----------|--------------|
| 框架 | Vue 3.4+（使用 Vite 5.x 构建系统）|
| 语言 | TypeScript 5.2+ |
| UI 库 | Element Plus 2.5+ |
| 状态管理 | Pinia 2.x |
| 路由 | Vue Router 4.x |
| 表单处理 | VeeValidate 4.x + Yup |
| 验证 | Yup schema 验证 |
| 样式 | Scoped CSS + Element Plus 主题变量 |
| 测试 | Vitest + Vue Test Utils |

## 3. 组件架构
```
src/
├── components/                # 可重用 UI 组件
│   ├── MistakeEntry/         # 题目录入组件
│   │   ├── CategorySelector.vue
│   │   ├── QuestionEditor.vue
│   │   └── PreviewPanel.vue
│   ├── Practice/             # 练习相关组件
│   │   ├── QuestionCard.vue
│   │   ├── OptionsList.vue
│   │   ├── Timer.vue
│   │   ├── AnswerSheet.vue
│   │   ├── DrawingCanvas.vue      # 画笔功能
│   │   ├── Toolbar.vue
│   │   └── Calculator.vue
│   ├── Analysis/             # 分析相关组件
│   │   ├── StatCard.vue
│   │   ├── AccuracyChart.vue
│   │   ├── TimeChart.vue
│   │   └── QuestionDetail.vue
│   ├── MistakeBook/          # 错题本组件
│   │   ├── MistakeCard.vue
│   │   ├── FilterPanel.vue
│   │   └── BatchActions.vue
│   ├── Statistics/           # 统计组件
│   │   ├── OverviewChart.vue
│   │   ├── SubjectChart.vue
│   │   ├── TrendChart.vue
│   │   └── StudyAdvice.vue
│   ├── Layout/               # 共享布局组件
│   │   ├── Header.vue
│   │   ├── Sidebar.vue
│   │   ├── Footer.vue
│   │   └── ErrorMessage.vue
│   └── Common/               # 通用组件
│       ├── Button.vue
│       ├── Modal.vue
│       ├── Loading.vue
│       └── Empty.vue
│
├── views/                   # 页面组件（Vue 3 使用 views）
│   ├── Home/                # 首页
│   │   └── Home.vue
│   ├── MistakeEntry/        # 错题录入页面
│   │   ├── MistakeEntry.vue
│   │   └── styles/
│   ├── Practice/            # 练习相关页面
│   │   ├── ExamSetup.vue    # 智能组卷
│   │   ├── Practice.vue     # 开始练习
│   │   └── Result.vue       # 结果分析
│   ├── MistakeBook/         # 错题本页面
│   │   ├── MistakeList.vue
│   │   └── ReviewSession.vue
│   ├── Statistics/          # 学习统计页面
│   │   └── Statistics.vue
│   ├── Analysis/            # 答案解析页面
│   │   └── AnswerAnalysis.vue
│   ├── Profile/             # 个人中心页面
│   │   ├── Profile.vue
│   │   ├── Settings.vue
│   │   └── History.vue
│   └── Dashboard/           # 仪表板
│       └── Dashboard.vue
│
├── composables/             # Vue 3 Composition API hooks
│   ├── useMistakeForm.ts
│   ├── useCategoryState.ts
│   ├── useReviewScheduler.ts
│   ├── usePractice.ts       # 练习相关逻辑
│   ├── useTimer.ts          # 计时器
│   ├── useDrawing.ts        # 画笔功能
│   └── useStatistics.ts     # 统计数据
│
├── services/               # API 服务
│   ├── mistakeService.ts
│   ├── practiceService.ts
│   ├── analysisService.ts
│   ├── statisticsService.ts
│   └── authService.ts
│
├── stores/                 # Pinia 状态管理
│   ├── auth.ts
│   ├── mistake.ts
│   ├── practice.ts
│   ├── statistics.ts
│   └── settings.ts
│
├── router/                 # Vue Router 配置
│   ├── index.ts
│   └── guards.ts           # 路由守卫
│
├── assets/                 # 静态资源
│   ├── styles/
│   │   ├── variables.scss  # 主题变量
│   │   ├── mixins.scss
│   │   └── global.scss
│   └── images/
│
├── utils/                  # 工具函数
│   ├── request.ts          # 请求封装
│   ├── storage.ts          # 本地存储
│   ├── format.ts           # 格式化
│   └── validate.ts         # 验证
│
└── types/                  # TypeScript 接口
    ├── mistake.ts
    ├── practice.ts
    ├── statistics.ts
    ├── response.ts
    └── category.ts
```

## 4. 关键页面设计：错题录入

### 4.1 组件流程
```
MistakeEntryPage
├─ CategorySelector（受控组件）
├─ QuestionEditor（富文本编辑器）
│   ├─ 文本格式化工具栏
│   └─ 自动解析预览
├─ PreviewPanel（只读视图）
│   ├─ 结构化数据显示
│   └─ 错误高亮
├─ SubmitButton（带加载状态）
└─ ErrorMessage（表单验证错误）
```

### 4.2 表单验证规则
| 字段 | 验证规则 |
|-------|------------------|
| 类别 | 必须选择 |
| 子类别 | 选择类别后必须选择 |
| 题目文本 | 最少 50 个字符，必须包含至少一个选项 |
| 选项 | 必须有 2-5 个选项，标记为 A、B、C、D 等 |
| 答案 | 必需，必须与选项标签匹配 |
| 用户答案 | 如果提供答案则必需 |
| 解析 | 可选但推荐（最少 50 个字符）|

## 5. 状态管理策略

### 5.1 Pinia Store 设计

```typescript
// stores/mistake.ts - 错题管理
import { defineStore } from 'pinia';

export const useMistakeStore = defineStore('mistake', {
  state: () => ({
    currentMistake: null as Mistake | null,
    mistakes: [] as Mistake[],
    filters: {
      subject: null as string | null,
      difficulty: null as string | null,
      status: null as string | null,
      keyword: ''
    },
    selectedIds: [] as number[],
    status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    error: null as string | null
  }),

  getters: {
    filteredMistakes: (state) => {
      return state.mistakes.filter(m => {
        if (state.filters.subject && m.subject !== state.filters.subject) return false;
        if (state.filters.difficulty && m.difficulty !== state.filters.difficulty) return false;
        if (state.filters.status && m.status !== state.filters.status) return false;
        if (state.filters.keyword && !m.content.includes(state.filters.keyword)) return false;
        return true;
      });
    },
    selectedMistakes: (state) => {
      return state.mistakes.filter(m => state.selectedIds.includes(m.id));
    }
  },

  actions: {
    async fetchMistakes() {
      this.status = 'loading';
      try {
        const response = await mistakeService.getMistakes(this.filters);
        this.mistakes = response.data;
        this.status = 'succeeded';
      } catch (error) {
        this.status = 'failed';
        this.error = error.message;
      }
    },
    async submitMistake(data: MistakeFormData) {
      const response = await mistakeService.submitMistake(data);
      return response.data;
    },
    toggleSelect(id: number) {
      const index = this.selectedIds.indexOf(id);
      if (index > -1) {
        this.selectedIds.splice(index, 1);
      } else {
        this.selectedIds.push(id);
      }
    },
    selectAll() {
      this.selectedIds = this.filteredMistakes.map(m => m.id);
    },
    clearSelection() {
      this.selectedIds = [];
    }
  }
});

// stores/practice.ts - 练习状态管理
export const usePracticeStore = defineStore('practice', {
  state: () => ({
    currentExam: null as Exam | null,
    currentIndex: 0,
    answers: {} as Record<number, Answer>,
    timeSpent: 0,
    timerStatus: 'idle' as 'idle' | 'running' | 'paused' | 'completed',
    drawingCanvas: {
      strokes: [] as Stroke[],
      isDrawing: false,
      currentTool: 'pen' as 'pen' | 'eraser',
      color: '#ff6e00',
      size: 2
    },
    toolbar: {
      showDraft: false,
      showCalculator: false,
      showDrawing: false
    }
  }),

  getters: {
    currentQuestion: (state) => {
      return state.currentExam?.questions[state.currentIndex];
    },
    progress: (state) => {
      if (!state.currentExam) return 0;
      return (state.currentIndex / state.currentExam.questions.length) * 100;
    },
    answeredCount: (state) => {
      return Object.keys(state.answers).length;
    },
    isQuestionAnswered: (state) => (questionId: number) => {
      return !!state.answers[questionId];
    }
  },

  actions: {
    setAnswer(questionId: number, answer: Answer) {
      this.answers[questionId] = answer;
    },
    nextQuestion() {
      if (this.currentExam && this.currentIndex < this.currentExam.questions.length - 1) {
        this.currentIndex++;
      }
    },
    prevQuestion() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      }
    },
    jumpToQuestion(index: number) {
      this.currentIndex = index;
    },
    startTimer() {
      this.timerStatus = 'running';
    },
    pauseTimer() {
      this.timerStatus = 'paused';
    },
    async submitExam() {
      this.timerStatus = 'completed';
      const response = await practiceService.submitExam({
        examId: this.currentExam!.id,
        answers: this.answers,
        timeSpent: this.timeSpent
      });
      return response.data;
    },
    // 画笔功能
    addStroke(stroke: Stroke) {
      this.drawingCanvas.strokes.push(stroke);
    },
    clearCanvas() {
      this.drawingCanvas.strokes = [];
    }
  }
});

// stores/statistics.ts - 统计数据管理
export const useStatisticsStore = defineStore('statistics', {
  state: () => ({
    overview: null as OverviewStats | null,
    todayStats: null as TodayStats | null,
    subjectStats: [] as SubjectStats[],
    timeRange: 'week' as 'week' | 'month' | 'quarter' | 'year',
    trendData: null as TrendData | null,
    advice: [] as string[],
    status: 'idle'
  }),

  actions: {
    async fetchOverview() {
      const response = await statisticsService.getOverview();
      this.overview = response.data;
    },
    async fetchTodayStats() {
      const response = await statisticsService.getTodayStats();
      this.todayStats = response.data;
    },
    async fetchSubjectStats() {
      const response = await statisticsService.getSubjectStats();
      this.subjectStats = response.data;
    },
    async fetchTrendData() {
      const response = await statisticsService.getTrendData(this.timeRange);
      this.trendData = response.data;
    },
    async fetchAdvice() {
      const response = await statisticsService.getAdvice();
      this.advice = response.data;
    }
  }
});

// stores/settings.ts - 设置管理
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'light' as 'light' | 'dark',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    autoNext: true,
    defaultOpenSheet: false,
    notifications: true
  }),

  actions: {
    updateTheme(theme: 'light' | 'dark') {
      this.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
    },
    updateFontSize(size: 'small' | 'medium' | 'large') {
      this.fontSize = size;
      document.documentElement.setAttribute('data-font-size', size);
    }
  }
});

// stores/auth.ts - 认证管理（保持原有设计）
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    status: 'unauthenticated' as 'unauthenticated' | 'authenticated' | 'loading',
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userInfo: (state) => state.user
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.status = 'loading';
      try {
        const response = await authService.login(credentials);
        this.user = response.data.user;
        this.token = response.data.token;
        localStorage.setItem('token', this.token);
        this.status = 'authenticated';
      } catch (error) {
        this.status = 'unauthenticated';
        this.error = error.message;
        throw error;
      }
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      this.status = 'unauthenticated';
    }
  },
  persist: true  // 持久化存储
});
```

## 6. API 集成

### 6.1 核心 API 调用
```typescript
// services/mistakeService.ts
export const submitMistake = async (data: MistakeFormData): Promise<MistakeResponse> => {
  const response = await api.post('/api/mistakes', data);
  return response.data;
};

export const getMistakeAnalysis = async (): Promise<AnalysisData> => {
  const response = await api.get('/api/mistakes/analysis');
  return response.data;
};
```

### 6.2 错误处理
- 根据 HTTP 状态码显示特定错误消息
- 对于 500+ 服务器错误显示通用错误
- 自动重试失败的请求（3 次尝试）
- 显示网络错误通知

## 7. 路由配置
```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/Layout/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/home'
      },
      {
        path: 'home',
        component: () => import('@/views/Home/Home.vue'),
        meta: { title: '首页', requiresAuth: false }
      },
      {
        path: 'dashboard',
        component: () => import('@/views/Dashboard/Dashboard.vue'),
        meta: { title: '仪表板', requiresAuth: true }
      },
      // 错题录入
      {
        path: 'mistake',
        children: [
          {
            path: 'entry',
            component: () => import('@/views/MistakeEntry/MistakeEntry.vue'),
            meta: { title: '错题录入', requiresAuth: true }
          }
        ]
      },
      // 练习相关
      {
        path: 'practice',
        children: [
          {
            path: 'setup',
            component: () => import('@/views/Practice/ExamSetup.vue'),
            meta: { title: '智能组卷', requiresAuth: true }
          },
          {
            path: ':id',
            component: () => import('@/views/Practice/Practice.vue'),
            meta: { title: '开始练习', requiresAuth: true }
          },
          {
            path: ':id/result',
            component: () => import('@/views/Practice/Result.vue'),
            meta: { title: '结果分析', requiresAuth: true }
          }
        ]
      },
      // 错题本
      {
        path: 'mistake-book',
        children: [
          {
            path: '',
            component: () => import('@/views/MistakeBook/MistakeList.vue'),
            meta: { title: '错题本', requiresAuth: true }
          },
          {
            path: 'review/:id',
            component: () => import('@/views/MistakeBook/ReviewSession.vue'),
            meta: { title: '复习错题', requiresAuth: true }
          }
        ]
      },
      // 学习统计
      {
        path: 'statistics',
        component: () => import('@/views/Statistics/Statistics.vue'),
        meta: { title: '学习统计', requiresAuth: true }
      },
      // 答案解析
      {
        path: 'analysis',
        component: () => import('@/views/Analysis/AnswerAnalysis.vue'),
        meta: { title: '答案解析', requiresAuth: true }
      },
      // 个人中心
      {
        path: 'profile',
        children: [
          {
            path: '',
            redirect: '/profile/info'
          },
          {
            path: 'info',
            component: () => import('@/views/Profile/Profile.vue'),
            meta: { title: '个人信息', requiresAuth: true }
          },
          {
            path: 'settings',
            component: () => import('@/views/Profile/Settings.vue'),
            meta: { title: '设置', requiresAuth: true }
          },
          {
            path: 'history',
            component: () => import('@/views/Profile/History.vue'),
            meta: { title: '学习记录', requiresAuth: true }
          }
        ]
      },
      {
        path: ':pathMatch(.*)*',
        redirect: '/home'
      }
    ]
  },
  // 登录页面（独立布局）
  {
    path: '/login',
    component: () => import('@/views/Auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    component: () => import('@/views/Auth/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    next('/home');
  } else {
    next();
  }
});

export default router;
```

## 8. UI/UX 规范

### 8.1 色彩方案
| 元素 | 颜色代码 |
|---------|------------|
| 主色 | #1890FF（Ant Design 蓝色）|
| 成功 | #52C41A |
| 警告 | #FAAD14 |
| 错误 | #FF4D4F |
| 背景 | #F5F5F5 |

### 8.2 响应式设计
- 移动优先方法（最小 320px 宽度）
- 断点：
  - 移动端：≤768px
  - 平板：769-1024px
  - 桌面端：≥1025px
- 自适应表单布局（移动端垂直，桌面端水平）

## 9. 无障碍功能
- 所有交互元素的 ARIA 标签
- 键盘导航支持
- 高对比度模式
- 屏幕阅读器兼容性
- 语义化 HTML 结构

## 10. 性能优化
- 使用 Vue 3 异步组件进行代码分割
- Element Plus 组件按需导入（unplugin-vue-components）
- 图片懒加载（v-lazy 指令）
- 表单状态防抖（lodash.debounce）
- API 请求批处理
- 使用 `<script setup>` 语法糖提升编译性能

## 11. 项目配置参考

### 11.1 Vite 配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### 11.2 Element Plus 按需导入
```typescript
// src/plugins/element-plus.ts
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export const elementPlusPlugins = [
  AutoImport({
    resolvers: [ElementPlusResolver()],
  }),
  Components({
    resolvers: [ElementPlusResolver()],
  }),
];
```

### 11.3 Pinia 持久化配置
```typescript
// src/stores/index.ts
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export default pinia;
```

## 12. 特殊功能设计

### 12.1 画笔功能 (DrawingCanvas)

**功能描述：**
- 在题目上层增加透明画布层
- 支持画笔和橡皮擦工具
- 画布不干扰页面滚动
- 支持一键清屏
- 支持保存草稿

**组件设计：**
```vue
<!-- components/Practice/DrawingCanvas.vue -->
<template>
  <canvas
    ref="canvasRef"
    :class="['drawing-canvas', { active: isActive }]"
    @mousedown="startDrawing"
    @mousemove="draw"
    @mouseup="stopDrawing"
    @mouseleave="stopDrawing"
    @touchstart.prevent="startDrawing"
    @touchmove.prevent="draw"
    @touchend="stopDrawing"
  />
  <div class="drawing-toolbar" v-if="isActive">
    <el-button-group>
      <el-button
        :type="currentTool === 'pen' ? 'primary' : ''"
        @click="setTool('pen')"
      >
        画笔
      </el-button>
      <el-button
        :type="currentTool === 'eraser' ? 'primary' : ''"
        @click="setTool('eraser')"
      >
        橡皮擦
      </el-button>
    </el-button-group>
    <el-color-picker v-model="color" />
    <el-slider v-model="size" :min="1" :max="10" />
    <el-button @click="clear">清屏</el-button>
    <el-button @click="save">保存</el-button>
    <el-button @click="close">关闭</el-button>
  </div>
</template>
```

**核心逻辑：**
```typescript
// composables/useDrawing.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useDrawing(canvasRef: Ref<HTMLCanvasElement | null>) {
  const isDrawing = ref(false);
  const currentTool = ref<'pen' | 'eraser'>('pen');
  const color = ref('#ff6e00');
  const size = ref(2);
  const strokes = ref<Stroke[]>([]);

  let ctx: CanvasRenderingContext2D | null = null;

  const initCanvas = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    isDrawing.value = true;
    const { x, y } = getCoordinates(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing.value) return;
    const { x, y } = getCoordinates(e);

    ctx!.lineWidth = size.value;
    ctx!.lineCap = 'round';
    ctx!.lineJoin = 'round';

    if (currentTool.value === 'pen') {
      ctx!.globalCompositeOperation = 'source-over';
      ctx!.strokeStyle = color.value;
    } else {
      ctx!.globalCompositeOperation = 'destination-out';
    }

    ctx!.lineTo(x, y);
    ctx!.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing.value) {
      isDrawing.value = false;
      ctx?.closePath();
    }
  };

  const clear = () => {
    const canvas = canvasRef.value;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const save = () => {
    const canvas = canvasRef.value;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      strokes.value.push({
        id: Date.now(),
        data: dataUrl,
        timestamp: new Date()
      });
    }
  };

  const getCoordinates = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.value;
    const rect = canvas?.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect!.left,
      y: clientY - rect!.top
    };
  };

  return {
    isDrawing,
    currentTool,
    color,
    size,
    strokes,
    initCanvas,
    startDrawing,
    draw,
    stopDrawing,
    clear,
    save
  };
}
```

**样式设计：**
```scss
.drawing-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;  // 默认不拦截事件
  z-index: 100;

  &.active {
    pointer-events: auto;  // 激活时拦截事件
  }
}

.drawing-toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 101;
}
```

### 12.2 快捷键系统

**快捷键配置：**
```typescript
// utils/shortcuts.ts
export const SHORTCUTS = {
  '1': () => selectOption(0),
  '2': () => selectOption(1),
  '3': () => selectOption(2),
  '4': () => selectOption(3),
  'ArrowLeft': () => prevQuestion(),
  'ArrowRight': () => nextQuestion(),
  'Enter': () => submitAnswer(),
  'Alt+C': () => toggleAnswerSheet(),
  'Alt+S': () => submitExam(),
  'Alt+D': () => toggleDrawing(),
  ' ': () => toggleTimer(),
  'Escape': () => closeModals()
};

export function registerShortcuts() {
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    const combo = [];

    if (e.altKey) combo.push('Alt');
    if (e.ctrlKey) combo.push('Ctrl');
    if (e.shiftKey) combo.push('Shift');
    combo.push(key);

    const shortcut = combo.join('+');
    if (SHORTCUTS[shortcut]) {
      e.preventDefault();
      SHORTCUTS[shortcut]();
    }
  });
}
```

### 12.3 答题卡组件

**组件功能：**
- 显示所有题目答题状态
- 快速跳转到指定题目
- 标记收藏题目
- 显示当前题目位置

```vue
<!-- components/Practice/AnswerSheet.vue -->
<template>
  <el-drawer v-model="visible" title="答题卡" size="350px">
    <div class="answer-sheet">
      <div class="sheet-grid">
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          :class="[
            'sheet-item',
            {
              current: index === currentIndex,
              answered: isAnswered(question.id),
              marked: isMarked(question.id)
            }
          ]"
          @click="jumpToQuestion(index)"
        >
          {{ index + 1 }}
        </div>
      </div>
      <div class="sheet-legend">
        <span class="legend-item current">当前</span>
        <span class="legend-item answered">已答</span>
        <span class="legend-item marked">收藏</span>
      </div>
    </div>
  </el-drawer>
</template>
```

## 13. 设计系统规范

### 13.1 色彩系统

#### 主色调（高顿教育橙色风格）
```scss
// assets/styles/variables.scss
:root {
  // 主色系
  --primary-color: #ff6e00;           // 主橙
  --primary-hover: #ff8c00;           // 悬停色
  --primary-light: rgba(255, 110, 0, 0.15);  // 浅橙背景
  --primary-text: rgb(255, 110, 0);    // 主色文字

  // 功能色
  --success-color: #52c41a;           // 成功色
  --success-hover: #73d13d;
  --warning-color: #faad14;           // 警告色
  --warning-hover: #ffc53d;
  --error-color: #f5222d;             // 错误色
  --error-hover: #ff4d4f;
  --info-color: #1890ff;              // 信息色
  --info-hover: #40a9ff;

  // 文字色系
  --text-primary: rgba(0, 0, 0, 0.85);      // 主要文字
  --text-secondary: rgba(0, 0, 0, 0.65);    // 次要文字
  --text-disabled: rgba(0, 0, 0, 0.25);     // 禁用文字
  --text-placeholder: rgba(0, 0, 0, 0.25);  // 占位文字

  // 背景色系
  --background-primary: rgb(240, 242, 245);   // 页面主背景
  --background-secondary: rgb(255, 255, 255); // 卡片背景
  --background-tertiary: rgb(250, 250, 250);  // 输入框背景
  --background-disabled: rgb(245, 245, 245);   // 禁用背景

  // 边框色系
  --border-color: #d9d9d9;
  --border-light: #f0f0f0;
  --border-disabled: #e8e8e8;

  // 阴影色系
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

#### 深色模式
```scss
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: rgba(255, 255, 255, 0.9);
    --text-secondary: rgba(255, 255, 255, 0.7);
    --background-primary: #1f1f1f;
    --background-secondary: #2c2c2c;
    --border-color: #4a4a4a;
  }
}
```

### 13.2 字体系统

```scss
:root {
  // 字号
  --font-size-xs: 12px;   // 极小字体
  --font-size-sm: 13px;   // 小字体
  --font-size-md: 14px;   // 默认字体
  --font-size-lg: 16px;   // 大字体
  --font-size-xl: 18px;   // 超大字体
  --font-size-xxl: 20px;  // 标题字体
  --font-size-title: 24px; // 主标题

  // 字重
  --font-weight-light: 300;    // 细体
  --font-weight-normal: 400;   // 常规
  --font-weight-medium: 500;   // 中等
  --font-weight-semibold: 600; // 半粗
  --font-weight-bold: 700;     // 粗体

  // 行高
  --line-height-tight: 1.2;    // 紧凑
  --line-height-normal: 1.5;   // 常规
  --line-height-loose: 1.8;    // 宽松
}
```

### 13.3 间距与圆角系统

```scss
:root {
  // 间距
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  // 圆角
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-round: 50%;
}
```

### 13.4 组件样式规范

#### 按钮样式
```scss
.tiku-btn-default {
  background-color: var(--background-secondary);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
  padding: 4px 11px;
  border-radius: var(--radius-md);
}

.tiku-btn-default:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tiku-btn-primary {
  background-color: var(--primary-light);
  color: var(--primary-text);
  border: 2px solid var(--primary-color);
  padding: 4px 11px;
  border-radius: var(--radius-md);
}

.tiku-btn-primary:hover {
  background-color: var(--primary-color);
  color: white;
}
```

#### 卡片样式
```scss
.tiku-card {
  background-color: var(--background-secondary);
  border-radius: var(--radius-lg);
  padding: var(--padding-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--margin-md);
}

.tiku-card-mistake {
  border-left: 4px solid var(--error-color);
}

.tiku-card-mastered {
  border-left-color: var(--success-color);
}

.tiku-card-learning {
  border-left-color: var(--warning-color);
}
```

#### 标签样式
```scss
.tag {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.tag-political { background-color: #e6f7ff; color: #1890ff; }
.tag-common { background-color: #f6ffed; color: #52c41a; }
.tag-verbal { background-color: #fff7e6; color: #faad14; }
.tag-judgment { background-color: #fff1f0; color: #f5222d; }
.tag-quantitative { background-color: #f9f0ff; color: #722ed1; }
```

### 13.5 动画效果

```scss
// 过渡动画
.transition-all {
  transition: all 0.3s ease;
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

// 加载动画
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading {
  animation: spin 1s linear infinite;
}

// 淡入淡出
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

### 13.6 响应式断点

```scss
// 断点定义
$breakpoints: (
  'xs': 0,
  'sm': 576px,
  'md': 768px,
  'lg': 992px,
  'xl': 1200px,
  'xxl': 1600px
);

// 移动端适配
@media (max-width: 768px) {
  body {
    font-size: var(--font-size-sm);
  }

  .btn {
    width: 100%;
    margin-bottom: var(--margin-sm);
  }
}
```

### 13.7 无障碍设计

#### ARIA 标签
```vue
<div
  role="dialog"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  aria-modal="true"
>
  <h2 id="modal-title">标题</h2>
  <p id="modal-description">描述</p>
</div>

<div role="status" aria-live="polite">操作成功</div>
<div role="alert" aria-live="assertive">操作失败</div>
```

#### 焦点管理
```css
:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

### 13.8 设计变量导出

```typescript
// assets/styles/variables.ts
export const designTokens = {
  colors: {
    primary: '#ff6e00',
    primaryHover: '#ff8c00',
    primaryLight: 'rgba(255, 110, 0, 0.15)',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff',
  },
  font: {
    size: {
      xs: '12px', sm: '13px', md: '14px',
      lg: '16px', xl: '18px', xxl: '20px', title: '24px'
    },
    weight: {
      light: 300, normal: 400, medium: 500,
      semibold: 600, bold: 700
    }
  },
  spacing: {
    xs: '4px', sm: '8px', md: '16px',
    lg: '24px', xl: '32px', xxl: '48px'
  },
  radius: {
    xs: '2px', sm: '4px', md: '6px',
    lg: '8px', xl: '12px', round: '50%'
  }
};
```
