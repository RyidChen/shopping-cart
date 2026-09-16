<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳至主要內容</a>
    <AppHeader />
    <div id="main-content" class="app-shell__main" tabindex="-1">
      <RouterView />
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppFooter from "./components/AppFooter.vue";
import AppHeader from "./components/AppHeader.vue";
</script>

<style scoped>
.app-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.app-shell__main {
  width: 100%;
  flex: 1;
}
.skip-link {
  position: fixed;
  z-index: 20;
  top: 0.75rem;
  left: 0.75rem;
  transform: translateY(-200%);
  border-radius: var(--radius-sm);
  padding: 0.7rem 1rem;
  color: var(--color-surface);
  background: var(--color-ink);
  font-weight: 700;
}
.skip-link:focus {
  transform: translateY(0);
}
</style>
