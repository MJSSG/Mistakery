<template>
  <div class="question-type-tag" :class="`type-${type}`">
    <component :is="icon" class="type-icon" />
    <span class="type-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Document,
  Checked,
  List,
  CircleCheck,
  Edit,
} from '@element-plus/icons-vue';

interface Props {
  type: 'choice' | 'choice-multi' | 'fill' | 'judge' | 'essay' | 'other';
}

const props = defineProps<Props>();

const label = computed(() => {
  const labels: Record<string, string> = {
    choice: '单选',
    'choice-multi': '多选',
    fill: '填空',
    judge: '判断',
    essay: '解答',
    other: '其他',
  };
  return labels[props.type] || '未知';
});

const icon = computed(() => {
  const icons: Record<string, any> = {
    choice: CircleCheck,
    'choice-multi': Checked,
    fill: Edit,
    judge: Document,
    essay: List,
    other: Document,
  };
  return icons[props.type] || Document;
});
</script>

<style scoped lang="scss">
.question-type-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);

  .type-icon {
    font-size: var(--font-size-base);
  }

  &.type-choice {
    background: var(--color-primary-light);
    color: var(--primary-color);
  }

  &.type-choice-multi {
    background: var(--color-success-light);
    color: var(--success-color);
  }

  &.type-fill {
    background: var(--color-warning-light);
    color: var(--warning-color);
  }

  &.type-judge {
    background: var(--color-info-light);
    color: var(--info-color);
  }

  &.type-essay {
    background: var(--color-danger-light);
    color: var(--danger-color);
  }

  &.type-other {
    background: var(--color-bg-dark);
    color: var(--color-text-secondary);
  }
}
</style>
