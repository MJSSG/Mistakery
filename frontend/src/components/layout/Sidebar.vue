<template>
  <aside class="app-sidebar" :class="{ 'is-collapsed': collapsed }">
    <div class="sidebar-content">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <template v-for="item in menuItems" :key="item.path">
          <el-sub-menu v-if="item.children" :index="item.path">
            <template #title>
              <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
            >
              <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  HomeFilled,
  Edit,
  Notebook,
  TrendCharts,
  User,
  Setting,
  Document,
  DataAnalysis,
} from '@element-plus/icons-vue';

interface MenuItem {
  path: string;
  title: string;
  icon?: any;
  children?: MenuItem[];
}

defineProps<{
  collapsed: boolean;
}>();

const route = useRoute();

const activeMenu = computed(() => route.path);

const menuItems: MenuItem[] = [
  {
    path: '/',
    title: '首页',
    icon: HomeFilled,
  },
  {
    path: '/mistake',
    title: '错题管理',
    icon: Notebook,
    children: [
      { path: '/mistake/entry', title: '录入错题', icon: Edit },
      { path: '/mistake/list', title: '错题本', icon: Document },
    ],
  },
  {
    path: '/practice',
    title: '练习中心',
    icon: DataAnalysis,
    children: [
      { path: '/practice', title: '智能组卷', icon: Setting },
      { path: '/user/history', title: '练习记录', icon: Document },
    ],
  },
  {
    path: '/review',
    title: '复习计划',
    icon: TrendCharts,
  },
  {
    path: '/statistics',
    title: '学习统计',
    icon: DataAnalysis,
  },
  {
    path: '/user',
    title: '个人中心',
    icon: User,
    children: [
      { path: '/user/profile', title: '个人信息' },
      { path: '/user/settings', title: '设置' },
      { path: '/user/history', title: '学习记录' },
    ],
  },
];
</script>

<style scoped lang="scss">
.app-sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-white);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition-duration) var(--transition-timing);
  z-index: 999;

  &.is-collapsed {
    width: var(--sidebar-collapsed-width);
  }
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }
}

.sidebar-menu {
  border: none;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 48px;
    line-height: 48px;

    &.is-active {
      color: var(--primary-color);
      background: var(--primary-color-light);
      border-right: 3px solid var(--primary-color);
    }
  }

  :deep(.el-icon) {
    font-size: 18px;
  }
}

@media (max-width: $breakpoint-md) {
  .app-sidebar {
    transform: translateX(-100%);
    transition: transform var(--transition-duration) var(--transition-timing);

    &.is-mobile-open {
      transform: translateX(0);
    }
  }
}
</style>
