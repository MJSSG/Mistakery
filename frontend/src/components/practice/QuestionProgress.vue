<template>
  <div class="question-progress">
    <div class="progress-info">
      <span class="current">{{ currentIndex + 1 }}</span>
      <span class="separator">/</span>
      <span class="total">{{ total }}</span>
    </div>

    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: `${percentage}%` }">
        <div class="progress-indicator" :class="{ 'pulse-animation': isAnimating }"></div>
      </div>
    </div>

    <div v-if="showTime" class="progress-time">
      <el-icon><Clock /></el-icon>
      <span>{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Clock } from '@element-plus/icons-vue';

interface Props {
  currentIndex: number;
  total: number;
  showTime?: boolean;
  elapsedTime?: number; // 已用时间（秒）
  isAnimating?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showTime: false,
  elapsedTime: 0,
  isAnimating: false,
});

const percentage = computed(() => {
  if (props.total === 0) return 0;
  return ((props.currentIndex + 1) / props.total) * 100;
});

const formattedTime = computed(() => {
  const minutes = Math.floor(props.elapsedTime / 60);
  const seconds = props.elapsedTime % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});
</script>

<style scoped lang="scss">
.question-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.progress-info {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;

  .current {
    font-size: var(--font-size-xl);
    color: var(--primary-color);
  }

  .separator {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .total {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
  }
}

.progress-bar-container {
  flex: 1;
  height: 8px;
  background: var(--color-bg-light);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-color-light));
  border-radius: var(--border-radius-full);
  transition: width var(--transition-normal);
  position: relative;

  .progress-indicator {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    background: var(--color-white);
    border: 3px solid var(--primary-color);
    border-radius: 50%;
    box-shadow: var(--shadow-sm);

    &.pulse-animation {
      animation: pulse 1.5s ease-in-out infinite;
    }
  }
}

.progress-time {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;

  .el-icon {
    font-size: var(--font-size-base);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translateY(-50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateY(-50%) scale(1.2);
    opacity: 0.8;
  }
}

@media (max-width: $breakpoint-sm) {
  .question-progress {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .progress-info,
  .progress-time {
    align-self: center;
  }
}
</style>
