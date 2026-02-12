<template>
  <div class="study-advice" v-loading="loading">
    <div v-if="data.length === 0" class="empty-state">
      <el-empty description="暂无学习建议" :image-size="60" />
    </div>
    <div v-else class="advice-list">
      <div
        v-for="(item, index) in data"
        :key="index"
        class="advice-item"
        :class="`advice-${item.type}`"
      >
        <div class="advice-icon">
          <el-icon v-if="item.type === 'success'"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="item.type === 'warning'"><WarningFilled /></el-icon>
          <el-icon v-else-if="item.type === 'error'"><CircleCloseFilled /></el-icon>
          <el-icon v-else><InfoFilled /></el-icon>
        </div>
        <div class="advice-content">
          <div class="advice-title">{{ item.title }}</div>
          <div class="advice-message">{{ item.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import {
  CircleCheckFilled,
  WarningFilled,
  CircleCloseFilled,
  InfoFilled,
} from '@element-plus/icons-vue';

interface AdviceItem {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

interface Props {
  loading?: boolean;
  data: AdviceItem[];
}

withDefaults(defineProps<Props>(), {
  loading: false,
  data: () => [],
});
</script>

<style scoped lang="scss">
.study-advice {
  padding: var(--spacing-md);
  min-height: 320px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 280px;
}

.advice-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.advice-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: all 0.2s;

  &.advice-success {
    background: #f0f9ff;
    border-left: 3px solid #67c23a;

    .advice-icon {
      color: #67c23a;
    }
  }

  &.advice-warning {
    background: #fdf6ec;
    border-left: 3px solid #e6a23c;

    .advice-icon {
      color: #e6a23c;
    }
  }

  &.advice-error {
    background: #fef2f2;
    border-left: 3px solid #f56c6c;

    .advice-icon {
      color: #f56c6c;
    }
  }

  &.advice-info {
    background: #f4f4f5;
    border-left: 3px solid #909399;

    .advice-icon {
      color: #909399;
    }
  }

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.advice-icon {
  flex-shrink: 0;
  font-size: 20px;
}

.advice-content {
  flex: 1;
  min-width: 0;
}

.advice-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.advice-message {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

@media (max-width: $breakpoint-sm) {
  .study-advice {
    padding: var(--spacing-sm);
  }

  .advice-item {
    padding: var(--spacing-sm);
  }
}
</style>
