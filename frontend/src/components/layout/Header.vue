<template>
  <header class="app-header">
    <div class="header-left">
      <el-button
        :icon="isCollapsed ? Expand : Fold"
        text
        @click="handleToggle"
      />
      <h1 class="header-title">{{ title }}</h1>
    </div>

    <div class="header-center">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索错题..."
        :prefix-icon="Search"
        class="search-input"
        clearable
        @keyup.enter="handleSearch"
      />
    </div>

    <div class="header-right">
      <el-button :icon="Notification" text />
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userAvatar">
            {{ userName?.charAt(0) }}
          </el-avatar>
          <span class="user-name">{{ userName }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Fold,
  Expand,
  Search,
  Notification,
  User,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const emit = defineEmits<{
  toggleSidebar: [];
}>();

const searchKeyword = ref('');

const isCollapsed = computed(() => authStore.isSidebarCollapsed);
const userName = computed(() => authStore.currentUser?.username || '用户');
const userAvatar = computed(() => authStore.currentUser?.avatarUrl);
const title = computed(() => import.meta.env.VITE_APP_TITLE || '错题本');

const handleToggle = () => {
  emit('toggleSidebar');
};

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/mistake/list', query: { keyword: searchKeyword.value } });
  }
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/user/profile');
      break;
    case 'settings':
      router.push('/user/settings');
      break;
    case 'logout':
      authStore.logout();
      ElMessage.success('退出登录成功');
      router.push('/login');
      break;
  }
};
</script>

<style scoped lang="scss">
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  .header-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--primary-color);
    margin: 0;
  }
}

.header-center {
  flex: 1;
  max-width: 500px;
  margin: 0 var(--spacing-xl);

  .search-input {
    width: 100%;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-duration);

  &:hover {
    background: var(--color-background);
  }

  .user-name {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }
}

@media (max-width: $breakpoint-md) {
  .app-header {
    padding: 0 var(--spacing-md);
  }

  .header-center {
    display: none;
  }
}
</style>
