<script setup lang="ts">
import { ref } from "vue";
import BaseButton from "./BaseButton.vue";

const dialog = ref<HTMLDialogElement | null>(null);
// 原生 dialog 負責鍵盤焦點、Esc 關閉及阻擋背景操作。
defineExpose({ show: () => dialog.value?.showModal() });
</script>

<template>
  <dialog
    ref="dialog"
    class="checkout-login"
    aria-labelledby="checkout-login-title"
  >
    <h2 id="checkout-login-title">請先登入再結帳</h2>
    <p>購物車商品會保留，登入後即可繼續結帳。</p>
    <form method="dialog">
      <BaseButton type="submit" variant="secondary">稍後再說</BaseButton>
      <RouterLink
        :to="{ name: 'login', query: { redirect: '/checkout' } }"
        @click="dialog?.close()"
      >
        前往登入
      </RouterLink>
    </form>
  </dialog>
</template>

<style scoped>
.checkout-login {
  width: min(25rem, calc(100% - 2rem));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  color: var(--color-ink);
  background: var(--color-surface);
}
.checkout-login::backdrop {
  background: rgb(26 25 23 / 48%);
}
h2 {
  margin: 0;
  font-size: 1.25rem;
}
p {
  margin: 0.75rem 0 1.5rem;
  color: var(--color-muted);
}
form {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}
a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0.65rem 1rem;
  border-radius: var(--radius-sm);
  color: var(--color-surface);
  background: var(--color-ink);
}
</style>
