<template>
  <div class="app-shell" :inert="auth.busy">
    <a class="skip-link" href="#main-content">跳至主要內容</a>
    <AppHeader />
    <div id="main-content" class="app-shell__main" tabindex="-1">
      <RouterView />
    </div>
    <AppFooter />
  </div>
  <!-- 登入／登出／註冊共用過場；inert 暫停背景操作，避免重複送出或誤切頁。 -->
  <Transition name="auth-loading">
    <div v-if="auth.busy" class="auth-loading" role="status" aria-live="polite">
      <span class="auth-loading__spinner" aria-hidden="true" />
      <p>處理中，請稍候…</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import AppFooter from "./components/AppFooter.vue";
import AppHeader from "./components/AppHeader.vue";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
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
.auth-loading {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgb(247 245 240 / 88%);
  backdrop-filter: blur(4px);
}
.auth-loading p {
  margin: 0;
  font-weight: 600;
}
.auth-loading__spinner {
  width: 2.25rem;
  height: 2.25rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-ink);
  border-radius: 50%;
  animation: auth-spin 0.7s linear infinite;
}
.auth-loading-enter-active,
.auth-loading-leave-active {
  transition: opacity var(--transition);
}
.auth-loading-enter-from,
.auth-loading-leave-to {
  opacity: 0;
}
@keyframes auth-spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
