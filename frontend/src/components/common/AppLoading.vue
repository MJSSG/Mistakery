<template>
  <div :class="['app-loading', `app-loading--${variant}`, { 'app-loading--fullscreen': fullscreen }]">
    <div v-if="variant === 'spinner'" class="app-loading__spinner">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle
          class="spinner__path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          :stroke="color"
          stroke-width="4"
        />
      </svg>
    </div>

    <div v-else-if="variant === 'dots'" class="app-loading__dots">
      <span class="dot" v-for="i in 3" :key="i" :style="{ backgroundColor: color }"></span>
    </div>

    <div v-else-if="variant === 'bar'" class="app-loading__bar">
      <div class="bar" :style="{ backgroundColor: color }"></div>
    </div>

    <div v-if="text" class="app-loading__text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'spinner' | 'dots' | 'bar';
  color?: string;
  text?: string;
  fullscreen?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'spinner',
  color: 'var(--primary-color)',
  text: '',
  fullscreen: false,
});
</script>

<style scoped lang="scss">
.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);

  &--fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
  }

  &__spinner {
    width: 40px;
    height: 40px;

    .spinner {
      animation: rotate 2s linear infinite;
      width: 100%;
      height: 100%;

      &__path {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: 0;
        stroke-linecap: round;
        animation: dash 1.5s ease-in-out infinite;
      }
    }
  }

  &__dots {
    display: flex;
    gap: var(--spacing-sm);

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: bounce 1.4s ease-in-out infinite both;

      &:nth-child(1) {
        animation-delay: -0.32s;
      }

      &:nth-child(2) {
        animation-delay: -0.16s;
      }
    }
  }

  &__bar {
    width: 200px;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;

    .bar {
      height: 100%;
      animation: progress 1.5s ease-in-out infinite;
    }
  }

  &__text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}
</style>
