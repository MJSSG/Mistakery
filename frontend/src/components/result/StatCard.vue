<template>
  <div class="stat-card">
    <div class="stat-icon-wrapper">
      <el-icon :class="iconClass">
        <component :is="icon" />
      </el-icon>
    </div>

    <div class="stat-content">
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value" :class="{ 'stat-value-green': isPositive, 'stat-value-red': isNegative, 'stat-value-blue': isBlue }">
        {{ formattedValue }}
      </div>
      <div v-if="showTrend" class="stat-trend">
        <el-icon>
          <ArrowUp v-if="trend > 0" />
          <ArrowDown v-else />
        </el-icon>
        <span class="trend-value">{{ Math.abs(trend) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUp, ArrowDown, Document } from '@element-plus/icons-vue';

interface Props {
  label: string;
  value: number;
  total?: number;
  icon?: any;
  showTrend?: boolean;
  trend?: number;
  type?: 'count' | 'percent' | 'time';
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  value: 0,
  total: 0,
  icon: Document,
  showTrend: false,
  trend: 0,
  type: 'count',
});

const iconClass = computed(() => 'stat-icon');

const isPositive = computed(() => props.type === 'correct' || props.type === 'accuracy' || (props.type === 'count' && props.trend > 0) || (props.type === 'time' && props.trend < 0));

const isNegative = computed(() => props.type === 'incorrect' || (props.type === 'count' && props.trend < 0) || (props.type === 'time' && props.trend > 0));

const isBlue = computed(() => props.type === 'users');

const formattedValue = computed(() => {
  if (props.type === 'percent') {
    return `${props.value.toFixed(1)}%`;
  }
  if (props.type === 'time') {
    return formatTime(props.value);
  }
  return props.value;
});

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
  }
  return `${mins}分${seconds % 60}秒`;
};
</script>

<style scoped lang="scss">
.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.stat-icon-wrapper {
  flex-shrink: 0;
}

.stat-icon {
  font-size: 28px;
  color: var(--primary-color);
}

.stat-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);

  &.stat-value-green {
    color: var(--success-color);
  }

  &.stat-value-red {
    color: var(--danger-color);
  }

  &.stat-value-blue {
    color: var(--info-color);
  }
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.trend-value {
  font-weight: var(--font-weight-medium);
}

:deep(.el-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
