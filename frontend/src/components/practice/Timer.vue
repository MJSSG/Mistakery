<template>
  <div class="timer" :class="{ 'timer-warning': isNearEnd, 'timer-danger': isDanger }">
    <div class="timer-display">
      <el-icon class="timer-icon" :class="{ 'timer-spin': isRunning }">
        <Timer />
      </el-icon>
      <span class="timer-value">{{ formattedTime }}</span>
    </div>

    <div v-if="showProgress" class="timer-progress">
      <div class="timer-progress-bar" :style="{ width: `${percentage}%` }"></div>
    </div>

    <div v-if="showControls" class="timer-controls">
      <el-button
        v-if="!isRunning && !isPaused"
        type="primary"
        size="small"
        :icon="VideoPlay"
        @click="handleStart"
      >
        开始
      </el-button>

      <el-button
        v-if="isRunning"
        type="warning"
        size="small"
        :icon="VideoPause"
        @click="handlePause"
      >
        暂停
      </el-button>

      <el-button
        v-if="isPaused"
        type="success"
        size="small"
        :icon="VideoPlay"
        @click="handleResume"
      >
        继续
      </el-button>

      <el-button
        v-if="isRunning || isPaused"
        size="small"
        :icon="RefreshRight"
        @click="handleReset"
      >
        重置
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimer } from '@/composables/useTimer';
import { VideoPlay, VideoPause, RefreshRight, Timer } from '@element-plus/icons-vue';

interface Props {
  initialTime: number; // 初始时间（秒）
  autoStart?: boolean;
  showProgress?: boolean;
  showControls?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onComplete?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  showProgress: true,
  showControls: true,
});

const emit = defineEmits<{
  (e: 'pause'): void;
  (e: 'resume'): void;
  (e: 'complete'): void;
  (e: 'tick', remaining: number): void;
}>();

const timer = useTimer({
  initialTime: props.initialTime,
  autoStart: props.autoStart,
  onPause: () => {
    props.onPause?.();
    emit('pause');
  },
  onResume: () => {
    props.onResume?.();
    emit('resume');
  },
  onComplete: () => {
    props.onComplete?.();
    emit('complete');
  },
  onTick: (remaining) => {
    emit('tick', remaining);
  },
});

const { formattedTime, isRunning, isPaused, isCompleted, percentage, isNearEnd } = timer;

// 当剩余时间少于30秒时，显示为危险状态
const isDanger = computed(() => {
  return timer.remaining.value <= 30;
});

const handleStart = () => timer.start();
const handlePause = () => timer.pause();
const handleResume = () => timer.resume();
const handleReset = () => timer.reset();

// 暴露方法给父组件
defineExpose({
  start: timer.start,
  pause: timer.pause,
  resume: timer.resume,
  stop: timer.stop,
  reset: timer.reset,
  addTime: timer.addTime,
  setTime: timer.setTime,
  isRunning: () => timer.isRunning.value,
  isPaused: () => timer.isPaused.value,
  isCompleted: () => timer.isCompleted.value,
  remaining: () => timer.remaining.value,
});

// 需要导入 computed
import { computed } from 'vue';
</script>

<style scoped lang="scss">
.timer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);

  &.timer-warning {
    background: var(--color-warning-light);
    box-shadow: var(--shadow-md);
  }

  &.timer-danger {
    background: var(--color-danger-light);
    animation: danger-pulse 1s ease-in-out infinite;
  }
}

.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.timer-icon {
  font-size: var(--font-size-xxl);
  color: var(--primary-color);

  &.timer-spin {
    animation: spin 2s linear infinite;
  }
}

.timer-value {
  font-size: 32px;
  font-weight: var(--font-weight-bold);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  color: var(--color-text-primary);
  letter-spacing: 2px;
}

.timer-progress {
  width: 100%;
  height: 6px;
  background: var(--color-bg-light);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.timer-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-color-light));
  border-radius: var(--border-radius-full);
  transition: width 1s linear;
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes danger-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

@media (max-width: $breakpoint-sm) {
  .timer-value {
    font-size: 24px;
  }

  .timer-icon {
    font-size: var(--font-size-xl);
  }
}
</style>
