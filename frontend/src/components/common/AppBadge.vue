<template>
  <div :class="['app-badge', `app-badge--${variant}`, `app-badge--${size}`]">
    <slot />
    <span v-if="content !== null && content !== undefined" class="app-badge__content">
      <template v-if="isDot">
        <span class="app-badge__dot" />
      </template>
      <template v-else>
        {{ formattedContent }}
      </template>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  content?: string | number;
  max?: number;
  isDot?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'default' | 'large';
  hidden?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  max: 99,
  isDot: false,
  variant: 'danger',
  size: 'default',
  hidden: false,
});

const formattedContent = computed(() => {
  if (typeof props.content === 'number' && props.content > props.max) {
    return `${props.max}+`;
  }
  return props.content;
});
</script>

<style scoped lang="scss">
.app-badge {
  position: relative;
  display: inline-flex;
  align-items: center;

  &__content {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
    z-index: 1;

    padding: 0 6px;
    min-width: 18px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    font-size: 11px;
    font-weight: var(--font-weight-medium);
    color: var(--color-white);
    background: var(--color-danger);
    border-radius: 9px;
    white-space: nowrap;
  }

  &--primary &__content {
    background: var(--primary-color);
  }

  &--success &__content {
    background: var(--color-success);
  }

  &--warning &__content {
    background: var(--color-warning);
  }

  &--info &__content {
    background: var(--color-info);
  }

  &--small &__content {
    padding: 0 4px;
    min-width: 14px;
    height: 14px;
    line-height: 14px;
    font-size: 10px;
    border-radius: 7px;
  }

  &--large &__content {
    padding: 0 8px;
    min-width: 22px;
    height: 22px;
    line-height: 22px;
    font-size: 12px;
    border-radius: 11px;
  }

  &__dot {
    display: block;
    width: 8px;
    height: 8px;
    background: var(--color-danger);
    border-radius: 50%;
  }

  &--primary &__dot {
    background: var(--primary-color);
  }

  &--success &__dot {
    background: var(--color-success);
  }

  &--warning &__dot {
    background: var(--color-warning);
  }

  &--info &__dot {
    background: var(--color-info);
  }
}
</style>
