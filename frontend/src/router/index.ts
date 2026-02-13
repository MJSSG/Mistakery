import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import type { RouterOptions } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页', requiresAuth: false }
  },
  {
    path: '/login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/user',
    component: () => import('@/components/layout/MainLayout.vue'),
    meta: { title: '个人中心', requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@/views/user/ProfileView.vue'),
        meta: { title: '个人资料' }
      },
      {
        path: 'settings',
        component: () => import('@/views/user/SettingsView.vue'),
        meta: { title: '设置' }
      },
      {
        path: 'history',
        component: () => import('@/views/user/HistoryView.vue'),
        meta: { title: '学习记录' }
      }
    ]
  },
  {
    path: '/mistake',
    component: () => import('@/components/layout/MainLayout.vue'),
    meta: { title: '错题本' },
    children: [
      {
        path: 'entry',
        component: () => import('@/views/mistake/MistakeEntryView.vue'),
        meta: { title: '录入错题' }
      },
      {
        path: 'list',
        component: () => import('@/views/mistake/MistakeListView.vue'),
        meta: { title: '错题本' }
      },
      {
        path: ':id',
        component: () => import('@/views/mistake/MistakeDetailView.vue'),
        meta: { title: '错题详情' }
      }
    ]
  },
  {
    path: '/practice',
    redirect: '/practice/setup',
    component: () => import('@/components/layout/MainLayout.vue'),
    meta: { title: '智能练习' },
    children: [
      {
        path: 'setup',
        component: () => import('@/views/practice/PracticeSetupView.vue'),
        meta: { title: '智能组卷' }
      },
      {
        path: 'list',
        component: () => import('@/views/practice/PracticeView.vue'),
        meta: { title: '练习列表' }
      },
      {
        path: 'history',
        component: () => import('@/views/practice/PracticeView.vue'),
        meta: { title: '练习记录' }
      },
      {
        path: ':id',
        component: () => import('@/views/practice/PracticeView.vue'),
        meta: { title: '开始练习' }
      },
      {
        path: 'record/:id',
        component: () => import('@/views/practice/ResultView.vue'),
        meta: { title: '练习结果' }
      },
      {
        path: 'record/:recordId/analysis',
        component: () => import('@/views/practice/AnswerAnalysisView.vue'),
        meta: { title: '答案解析' }
      }
    ]
  },
  {
    path: '/review',
    component: () => import('@/components/layout/MainLayout.vue'),
    meta: { title: '智能复习' },
    children: [
      {
        path: '',
        component: () => import('@/views/review/ReviewView.vue'),
        meta: { title: '复习系统' }
      },
      {
        path: 'session/:id',
        component: () => import('@/views/review/ReviewSessionView.vue'),
        meta: { title: '开始复习' }
      }
    ]
  },
  {
    path: '/statistics',
    component: () => import('@/views/statistics/StatisticsView.vue'),
    meta: { title: '学习统计' }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/ErrorView.vue'),
    meta: { title: '404' }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, left: 0 };
  },
});

// 路由守卫 - 修复后：正确判断认证状态
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - Mistakery` : 'Mistakery';

  // 检查认证状态
  const hasToken = !!localStorage.getItem('mistakery_token');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // 根据认证状态决定导航
  if (requiresAuth) {
    // 路由需要认证
    if (hasToken) {
      next();
    } else {
      // 用户未登录，重定向到登录页
      next('/login');
    }
  } else {
    // 路由不需要认证，直接放行
    next();
  }
});

export default router;
