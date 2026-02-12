<template>
  <div class="progress-bar">
    <div class="progress-bar-header">
      <span class="progress-label">{{ label }}</span>
      <span class="progress-percentage">{{ percentage }}%</span>
    </div>
    <div class="progress-track">
      <div
        class="progress-fill"
        :style="{ width: `${percentage}%`, backgroundColor: color }"
      />
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label?: string;
  value: number;
  total: number;
  showLabel?: boolean;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: '完成进度',
  value: 0,
  total: 100,
  showLabel: true,
  color: 'var(--primary-color)',
});

const percentage = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.value / props.total) * 100);
});

const actualColor = computed(() => {
  const percentageValue = percentage.value;
  if (percentageValue < 30) return 'var(--danger-color)';
  if (percentageValue < 60) return 'var(--warning-color)';
  return props.color;
});
</script>

<style scoped lang="scss">
.progress-bar {
  .progress-bar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  }

  .progress-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .progress-percentage {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
  }

  .progress-track {
  height: 8px;
  background: var(--color-bg-light);
  border-radius:  var(--border-radius-md);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
  border-radius: var(--border-radius-md);
    transition: width var(--transition-fast);
  }
}
</style>
