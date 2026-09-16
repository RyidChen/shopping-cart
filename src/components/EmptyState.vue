<!-- 購物車空白、搜尋無結果等共用空狀態 -->
<script setup lang="ts">
// actionLabel 與 to 同時存在時顯示預設操作；slot 可補充其他自訂內容。
defineProps<{
  title: string;
  message: string;
  actionLabel?: string;
  to?: string;
}>();
</script>

<template>
  <section class="empty-state">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <RouterLink v-if="actionLabel && to" class="empty-state__action" :to="to">
      {{ actionLabel }}
    </RouterLink>
    <slot />
  </section>
</template>

<style scoped>
.empty-state {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  padding: clamp(3rem, 10vw, 7rem) 1rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}
h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3rem);
}
p {
  max-width: 32rem;
  margin: 0;
  color: var(--color-muted);
}
.empty-state__action {
  margin-top: 0.5rem;
  border-radius: var(--radius-sm);
  padding: 0.7rem 1rem;
  color: var(--color-surface);
  background: var(--color-ink);
  font-weight: 600;
}
</style>
