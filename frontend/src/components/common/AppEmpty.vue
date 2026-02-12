<template>
  <div :class="['app-empty', `app-empty--${size}`]">
    <div class="app-empty__image">
      <slot name="image">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1"/>
          <path d="M100 60V140M60 100H140" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </slot>
    </div>

    <div v-if="description" class="app-empty__description">
      {{ description }}
    </div>

    <div v-if="$slots.default" class="app-empty__content">
      <slot />
    </div>

    <div v-if="$slots.footer" class="app-empty__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  description?: string;
  size?: 'small' | 'default' | 'large';
  image?: string;
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  size: 'default',
});
</script>

<style scoped lang="scss">
.app-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);

  &--small {
    padding: var(--spacing-lg);
  }

  &--large {
    padding: var(--spacing-xxxl);
  }

  &__image {
    width: 120px;
    height: 120px;
    margin-bottom: var(--spacing-lg);
    opacity: 0.5;

    svg {
      width: 100%;
      height: 100%;
    }

    .app-empty--small & {
      width: 80px;
      height: 80px;
    }

    .app-empty--large & {
      width: 160px;
      height: 160px;
    }
  }

  &__description {
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-md);

    .app-empty--small & {
      font-size: var(--font-size-sm);
    }

    .app-empty--large & {
      font-size: var(--font-size-lg);
    }
  }

  &__content {
    margin-bottom: var(--spacing-lg);
  }
}
</style>
