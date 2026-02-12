<template>
  <footer class="app-footer">
    <div class="footer-content">
      <p class="footer-text">
        &copy; {{ currentYear }} Mistakery. 高效学习，智能复习
      </p>
      <div class="footer-links">
        <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
        <a href="#" @click.prevent>关于我们</a>
        <a href="#" @click.prevent>使用协议</a>
        <a href="#" @click.prevent>隐私政策</a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped lang="scss">
.app-footer {
  height: var(--footer-height);
  background: var(--color-white);
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-md) var(--spacing-xl);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.footer-links {
  display: flex;
  gap: var(--spacing-lg);

  a {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: color var(--transition-duration);

    &:hover {
      color: var(--primary-color);
    }
  }
}

@media (max-width: $breakpoint-md) {
  .footer-content {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }

  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-md);
  }
}
</style>
