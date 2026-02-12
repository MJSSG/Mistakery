<template>
  <div
    :class="[
      'app-card',
      `app-card--${variant}`,
      { 'app-card--hoverable': hoverable, 'app-card--bordered': bordered },
    ]"
    :style="customStyle"
  >
    <div v-if="$slots.header || title" class="app-card__header">
      <slot name="header">
        <div class="app-card__title">
          <el-icon v-if="icon" class="app-card__icon">
            <component :is="icon" />
          </el-icon>
          <h3>{{ title }}</h3>
          <div v-if="$slots.extra" class="app-card__extra">
            <slot name="extra" />
          </div>
        </div>
      </slot>
    </div>

    <div class="app-card__body" :class="{ 'app-card__body--padding': !noPadding }">
      <slot />
    </div>

    <div v-if="$slots.footer" class="app-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  icon?: any;
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  hoverable?: boolean;
  bordered?: boolean;
  noPadding?: boolean;
  shadow?: 'never' | 'hover' | 'always';
  customStyle?: Record<string, string>;
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: false,
  bordered: true,
  noPadding: false,
  shadow: 'hover',
});
</script>

<style scoped lang="scss">
.app-card {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-duration) var(--transition-timing);

  &--bordered {
    border: 1px solid var(--color-border);
  }

  &--elevated {
    box-shadow: var(--shadow-md);
  }

  &--filled {
    background: var(--color-background);
    border: none;
  }

  &--outlined {
    background: transparent;
    border: 2px solid var(--color-border);
  }

  &--hoverable {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }

  &__header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin: 0;

    h3 {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
      flex: 1;
    }
  }

  &__icon {
    font-size: 20px;
    color: var(--primary-color);
  }

  &__extra {
    margin-left: auto;
  }

  &__body {
    &--padding {
      padding: var(--spacing-lg);
    }
  }

  &__footer {
    padding: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
  }
}
</style>
