<template>
  <div class="error-view">
    <div class="error-container">
      <div class="error-emoji">🤔</div>
      <h1 class="error-title">404</h1>
      <p class="error-desc">抱歉，页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<style scoped lang="scss">
.error-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.error-container {
  text-align: center;
}

.error-emoji {
  font-size: 80px;
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: var(--font-size-xxxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.error-desc {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}
</style>
