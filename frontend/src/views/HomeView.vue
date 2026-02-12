<template>
  <div class="home-view">
    <!-- 导航栏 -->
    <header class="home-header">
      <div class="header-container">
        <div class="logo">
          <span class="logo-icon">📚</span>
          <span class="logo-text">Mistakery 错题本</span>
        </div>
        <nav class="nav-menu">
          <template v-if="isAuthenticated">
            <span class="user-greeting">{{ currentUser?.username || '用户' }}</span>
            <a @click="handleLogout" class="nav-link">退出</a>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link">登录</router-link>
            <router-link to="/register" class="nav-link nav-link-primary">注册</router-link>
          </template>
        </nav>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="home-container">
      <div class="welcome-section">
        <h1 class="welcome-title">欢迎使用错题本</h1>
        <p class="welcome-desc">高效管理错题，智能复习巩固</p>
        <div class="action-buttons">
          <router-link to="/register" class="btn btn-primary">
            立即开始
          </router-link>
          <router-link to="/login" class="btn btn-secondary">
            已有账号？登录
          </router-link>
        </div>
      </div>

      <div class="feature-cards">
        <div
          class="feature-card"
          v-for="feature in features"
          :key="feature.title"
          @click="navigateToFeature(feature.path)"
        >
          <div class="feature-icon" :style="{ backgroundColor: feature.color }">
            <span class="icon-emoji">{{ feature.icon }}</span>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.desc }}</p>
          <div class="feature-arrow">→</div>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <footer class="home-footer">
      <p>Mistakery 错题本 - 让学习更高效</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentUser = computed(() => authStore.currentUser);

const handleLogout = () => {
  authStore.logout();
  ElMessage.success('退出登录成功');
  router.push('/login');
};

const features = [
  {
    icon: '📝',
    title: '错题录入',
    desc: '快速录入错题，支持多种题型',
    color: '#ff6e00',
    path: '/mistake/entry',
  },
  {
    icon: '📚',
    title: '错题本',
    desc: '分类管理科目，结构清晰',
    color: '#00d4aa',
    path: '/mistake/list',
  },
  {
    icon: '🔄',
    title: '智能复习',
    desc: '艾宾浩斯算法，科学复习',
    color: '#6c5ce7',
    path: '/review',
  },
  {
    icon: '📊',
    title: '数据分析',
    desc: '统计分析学习进度',
    color: '#fd79a8',
    path: '/statistics',
  },
  {
    icon: '✏️',
    title: '智能组卷',
    desc: '个性化练习，针对性提升',
    color: '#74b9ff',
    path: '/practice',
  },
  {
    icon: '👤',
    title: '个人中心',
    desc: '管理账户信息和学习记录',
    color: '#a29bfe',
    path: '/user/profile',
  },
];

const navigateToFeature = (path: string) => {
  // 检查是否已登录
  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.warning('请先登录');
    router.push('/login');
  } else {
    router.push(path);
  }
};
</script>

<style scoped lang="scss">
.home-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
}

// 导航栏
.home-header {
  background: var(--color-white);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  cursor: pointer;

  .logo-icon {
    font-size: 28px;
  }

  .logo-text {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--primary-color);
  }
}

.nav-menu {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.user-greeting {
  padding: var(--spacing-sm) var(--spacing-lg);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.nav-link {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  text-decoration: none;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;

  &:hover {
    background: var(--color-background);
    color: var(--primary-color);
  }

  &.nav-link-primary {
    background: var(--primary-color);
    color: var(--color-white);

    &:hover {
      background: #e65c00;
      color: var(--color-white);
    }
  }
}

// 主内容区
.home-container {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xxl) var(--spacing-xl);
  width: 100%;
  box-sizing: border-box;
}

.welcome-section {
  text-align: center;
  margin-bottom: var(--spacing-xxl);
}

.welcome-title {
  font-size: var(--font-size-xxxl);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
}

.welcome-desc {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.btn {
  padding: var(--spacing-md) var(--spacing-xxl);
  border-radius: var(--border-radius-lg);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
  display: inline-block;

  &.btn-primary {
    background: var(--primary-color);
    color: var(--color-white);

    &:hover {
      background: #e65c00;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 110, 0, 0.3);
    }
  }

  &.btn-secondary {
    background: var(--color-white);
    color: var(--primary-color);
    border: 2px solid var(--primary-color);

    &:hover {
      background: var(--color-background);
      transform: translateY(-2px);
    }
  }
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.feature-card {
  padding: var(--spacing-xl);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-lg);

    .feature-arrow {
      transform: translateX(4px);
    }
  }

  &:active {
    transform: translateY(-2px);
  }
}

.feature-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-md);

  .icon-emoji {
    font-size: 32px;
  }
}

.feature-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.feature-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.feature-arrow {
  position: absolute;
  top: var(--spacing-xl);
  right: var(--spacing-xl);
  font-size: 24px;
  color: var(--primary-color);
  transition: transform 0.3s ease;
}

// 页脚
.home-footer {
  background: var(--color-white);
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  border-top: 1px solid var(--color-border);
}
</style>
