/**
 * 路由懒加载工具
 * 实现组件和页面的按需加载
 */

/**
 * 路由懒加载包装器
 * 自动处理加载状态和错误
 */
export function lazyLoad(
  importFn: () => Promise<{ default: any }>,
  loadingComponent?: any,
  errorComponent?: any
) {
  return () => ({
    component: importFn(),
    loading: loadingComponent,
    error: errorComponent,
    delay: 200, // 延迟显示加载状态
    timeout: 10000, // 超时时间
  });
}

/**
 * 组件懒加载包装器
 */
export function lazyComponent(importFn: () => Promise<any>) {
  return defineAsyncComponent({
    loader: importFn,
    loadingComponent: {
      template: '<div class="loading-skeleton"><el-skeleton /></div>',
    },
    errorComponent: {
      template: '<el-result icon="error" title="加载失败" />',
    },
    delay: 200,
    timeout: 10000,
  });
}

/**
 * 模块懒加载映射
 * 按功能模块分组，优化加载性能
 */
export const lazyModules = {
  // 核心模块
  mistake: () => import('@/views/mistake/MistakeEntryView.vue'),
  practice: () => import('@/views/practice/PracticeView.vue'),
  review: () => import('@/views/review/ReviewView.vue'),

  // 统计模块
  statistics: () => import('@/views/statistics/StatisticsView.vue'),
  result: () => import('@/views/practice/ResultView.vue'),

  // 用户模块
  profile: () => import('@/views/user/ProfileView.vue'),
  settings: () => import('@/views/user/SettingsView.vue'),
  history: () => import('@/views/user/HistoryView.vue'),

  // 认证模块
  login: () => import('@/views/auth/LoginView.vue'),
  register: () => import('@/views/auth/RegisterView.vue'),
};

/**
 * 组件懒加载映射
 */
export const lazyComponents = {
  // 练习组件
  AnswerSheet: () => import('@/components/practice/AnswerSheet.vue'),
  DrawingCanvas: () => import('@/components/practice/DrawingCanvas.vue'),
  Toolbar: () => import('@/components/practice/Toolbar.vue'),

  // 统计组件
  TrendLineChart: () => import('@/components/statistics/TrendLineChart.vue'),
  SubjectBarChart: () => import('@/components/statistics/SubjectBarChart.vue'),
  MistakePieChart: () => import('@/components/statistics/MistakePieChart.vue'),

  // 复习组件
  LeitnerBox: () => import('@/components/review/LeitnerBox.vue'),
  ReviewProgress: () => import('@/components/review/ReviewProgress.vue'),
};

/**
 * 预加载路由模块
 * 在空闲时预加载指定路由
 */
export function preloadRoute(routeName: keyof typeof lazyModules) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      lazyModules[routeName]();
    });
  } else {
    setTimeout(() => {
      lazyModules[routeName]();
    }, 2000);
  }
}

/**
 * 批量预加载路由
 */
export function preloadRoutes(routeNames: (keyof typeof lazyModules)[]) {
  routeNames.forEach(routeName => preloadRoute(routeName));
}

/**
 * 图片懒加载指令
 */
export const imageLazyLoadDirective = {
  mounted(el: HTMLImageElement, binding: any) {
    const loadImage = () => {
      if (binding.value) {
        el.src = binding.value;
        el.classList.add('loaded');
      }
    };

    // 使用 Intersection Observer
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              loadImage();
              observer.unobserve(el);
            }
          });
        },
        {
          rootMargin: '50px', // 提前50px开始加载
        }
      );
      observer.observe(el);

      // 保存 observer 用于清理
      (el as any)._observer = observer;
    } else {
      // 不支持则直接加载
      loadImage();
    }
  },

  unmounted(el: HTMLImageElement) {
    if ((el as any)._observer) {
      (el as any)._observer.disconnect();
    }
  },
};
