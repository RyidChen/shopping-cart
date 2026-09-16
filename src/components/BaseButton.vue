<!-- 共用按鈕 variant、loading、disabled 狀態 -->
<script setup lang="ts">
// 集中管理按鈕外觀與共用狀態，呼叫端只需指定需要的 variant。
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "text";
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  { variant: "primary", type: "button" },
);
</script>

<template>
  <!-- 載入時同步停用按鈕，避免非同步操作被重複送出。 -->
  <button
    class="button"
    :class="`button--${variant}`"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.button {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.65rem 1rem;
  font-weight: 600;
  transition:
    background-color var(--transition),
    border-color var(--transition),
    color var(--transition),
    opacity var(--transition);
}
.button:hover:not(:disabled) {
  opacity: 0.78;
}
.button:disabled {
  opacity: 0.55;
}
.button--primary {
  color: var(--color-surface);
  background: var(--color-ink);
}
.button--secondary {
  color: var(--color-ink);
  background: var(--color-surface);
  border-color: var(--color-border);
}
.button--text {
  padding: 0;
  color: var(--color-ink);
  background: transparent;
}
.button__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
