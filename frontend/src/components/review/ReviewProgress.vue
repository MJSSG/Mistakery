<template>
  <div class="review-progress">
    <div class="progress-header">
      <div class="progress-info">
        <span class="label">复习进度</span>
        <span class="count">{{ current }} / {{ total }}</span>
      </div>

      <div class="progress-percentage">
        <span :class="percentageClass">{{ percentage }}%</span>
      </div>
    </div>

    <div class="progress-bar-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :class="fillClass"
          :style="{ width: `${percentage}%` }"
        >
          <div class="progress-shine"></div>
        </div>
      </div>

      <!-- 进度刻度 -->
      <div class="progress-ticks">
        <div
          v-for="i in Math.min(total, 10)"
          :key="i"
          class="tick"
          :class="{ 'is-completed': i <= current }"
        ></div>
      </div>
    </div>

    <!-- 时间统计 -->
    <div v-if="showTime" class="progress-time">
      <div class="time-item">
        <el-icon><Clock /></el-icon>
        <span>{{ formatTime(elapsedTime) }}</span>
      </div>

      <div class="time-item">
        <el-icon><Timer /></el-icon>
        <span>{{ formatTime(estimatedTime) }}</span>
      </div>
    </div>

    <!-- 快捷跳转 -->
    <div v-if="total > 10" class="progress-jumps">
      <el-button
        v-for="jump in jumps"
        :key="jump.value"
        size="small"
        :type="current >= jump.value ? 'primary' : 'default'"
        :disabled="jump.value > total"
        @click="$emit('jump', jump.value)"
      >
        {{ jump.label }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Clock, Timer } from '@element-plus/icons-vue';

interface Props {
  current: number;
  total: number;
  elapsedTime?: number; // 已用时间（秒）
  estimatedTime?: number; // 预计总时间（秒）
  showTime?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  elapsedTime: 0,
  estimatedTime: 0,
  showTime: true,
});

defineEmits<{
  jump: [index: number];
}>();

/**
 * 完成百分比
 */
const percentage = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.current / props.total) * 100);
});

/**
 * 进度条样式类
 */
const percentageClass = computed(() => {
  if (percentage.value >= 80) return 'is-excellent';
  if (percentage.value >= 50) return 'is-good';
  return 'is-normal';
});

/**
 * 填充样式类
 */
const fillClass = computed(() => {
  if (percentage.value >= 80) return 'fill-excellent';
  if (percentage.value >= 50) return 'fill-good';
  return 'fill-normal';
});

/**
 * 快捷跳转点
 */
const jumps = computed(() => {
  const jumps = [];
  const step = Math.ceil(props.total / 5);

  for (let i = 1; i <= 5; i++) {
    const value = Math.min(i * step, props.total);
    jumps.push({
      label: `${Math.round((i / 5) * 100)}%`,
      value,
    });
  }

  return jumps;
});

/**
 * 格式化时间
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
</script>

<style scoped lang="scss">
.review-progress {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.progress-info {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);

  .label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .count {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
}

.progress-percentage {
  span {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);

    &.is-excellent {
      color: var(--success-color);
    }

    &.is-good {
      color: var(--primary-color);
    }

    &.is-normal {
      color: var(--color-text-primary);
    }
  }
}

.progress-bar-container {
  position: relative;
}

.progress-bar {
  height: 12px;
  background: var(--color-bg-light);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: var(--border-radius-full);
  position: relative;
  transition: width 0.3s ease;

  &.fill-normal {
    background: linear-gradient(90deg, var(--info-color), var(--primary-color));
  }

  &.fill-good {
    background: linear-gradient(90deg, var(--primary-color), var(--success-color));
  }

  &.fill-excellent {
    background: linear-gradient(90deg, var(--success-color), #67c23a);
  }
}

.progress-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-ticks {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-xs);
  padding: 0 2px;
}

.tick {
  width: 4px;
  height: 4px;
  background: var(--color-border);
  border-radius: 50%;

  &.is-completed {
    background: var(--primary-color);
  }
}

.progress-time {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.time-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.progress-jumps {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}
</style>
