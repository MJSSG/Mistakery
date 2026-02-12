<template>
  <div class="main-layout" :class="{ 'is-collapsed': isCollapsed }">
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <div class="main-container">
      <AppSidebar :collapsed="isCollapsed" />

      <main class="main-content">
        <RouterView />
      </main>
    </div>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import AppHeader from './Header.vue';
import AppSidebar from './Sidebar.vue';
import AppFooter from './Footer.vue';

const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-container {
  display: flex;
  flex: 1;
  margin-top: var(--header-height);
}

.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: var(--spacing-xl);
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  background: var(--color-background);

  .main-layout.is-collapsed & {
    margin-left: var(--sidebar-collapsed-width);
  }
}

@media (max-width: $breakpoint-md) {
  .main-content {
    margin-left: 0;
    padding: var(--spacing-md);
  }
}
</style>
