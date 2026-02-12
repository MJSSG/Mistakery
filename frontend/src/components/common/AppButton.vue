<template>
  <el-button
    :type="localType"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :icon="icon"
    :plain="plain"
    :round="round"
    :circle="circle"
    :class="['app-button', `app-button--${variant}`]"
    v-bind="$attrs"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElButton } from 'element-plus';

interface Props {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text';
  variant?: 'default' | 'gradient' | 'ghost' | 'link';
  size?: 'large' | 'default' | 'small';
  disabled?: boolean;
  loading?: boolean;
  icon?: any;
  plain?: boolean;
  round?: boolean;
  circle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  variant: 'default',
  size: 'default',
  disabled: false,
  loading: false,
  plain: false,
  round: false,
  circle: false,
});

const localType = computed(() => {
  if (props.variant === 'gradient') return 'primary';
  return props.type;
});
</script>

<style scoped lang="scss">
.app-button {
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-duration) var(--transition-timing);

  &.app-button--gradient {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
    border: none;
    color: var(--color-white);

    &:hover,
    &:focus {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 110, 0, 0.3);
    }
  }

  &.app-button--ghost {
    background: transparent;
    border-color: currentColor;

    &:hover {
      background: rgba(255, 110, 0, 0.1);
    }
  }

  &.app-button--link {
    border: none;
    padding: 0;
    height: auto;
    line-height: 1;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
