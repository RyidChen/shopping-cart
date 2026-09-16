<!-- 搜尋、分類、價格、排序；手機使用原生 dialog -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import type { ProductFilters } from "../types/commerce";
import CatalogFilterFields from "./CatalogFilterFields.vue";

defineProps<{ filters: ProductFilters; categories: string[] }>();
const emit = defineEmits<{
  update: [changes: Record<string, string>];
  reset: [];
}>();
const dialog = ref<HTMLDialogElement>();

// 原生 dialog 會協助處理焦點鎖定、Esc 關閉與背景遮罩。
function openDialog() {
  dialog.value?.showModal();
}

function resetFilters() {
  emit("reset");
  dialog.value?.close();
}

// 切換到桌面版時關閉手機對話框，避免隱藏的 dialog 繼續鎖住頁面焦點。
let desktopQuery: MediaQueryList;
function closeDialogOnDesktop() {
  if (desktopQuery.matches) dialog.value?.close();
}
onMounted(() => {
  desktopQuery = window.matchMedia("(min-width: 64rem)");
  desktopQuery.addEventListener("change", closeDialogOnDesktop);
});
onUnmounted(() => {
  desktopQuery.removeEventListener("change", closeDialogOnDesktop);
});
</script>

<template>
  <div class="catalog-filters">
    <button class="catalog-filters__open" type="button" @click="openDialog">
      篩選與排序
    </button>
    <!-- 桌面版常駐側欄；手機版改用下方 dialog，兩者共用相同更新事件。 -->
    <aside class="catalog-filters__desktop" aria-label="商品篩選">
      <CatalogFilterFields
        :filters="filters"
        :categories="categories"
        @update="emit('update', $event)"
        @reset="resetFilters"
      />
    </aside>
    <dialog ref="dialog" class="catalog-filters__dialog" aria-label="商品篩選">
      <form method="dialog" class="catalog-filters__dialog-header">
        <strong>篩選與排序</strong>
        <button type="submit" aria-label="關閉篩選">關閉</button>
      </form>
      <CatalogFilterFields
        :filters="filters"
        :categories="categories"
        @update="emit('update', $event)"
        @reset="resetFilters"
      />
    </dialog>
  </div>
</template>

<style scoped>
.catalog-filters__open,
.catalog-filters__dialog button {
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-ink);
  background: var(--color-surface);
  font-weight: 600;
}
.catalog-filters__open {
  width: 100%;
}
.catalog-filters__desktop {
  display: none;
}
.catalog-filters__dialog {
  width: min(100% - 2rem, 30rem);
  max-height: min(80dvh, 42rem);
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-ink);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}
.catalog-filters__dialog::backdrop {
  background: rgb(26 25 23 / 42%);
}
.catalog-filters__dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.catalog-filters__dialog-header strong {
  font-family: var(--font-display);
  font-size: 1.35rem;
}
.catalog-filters__dialog button {
  padding-inline: 0.8rem;
}
@media (min-width: 64rem) {
  .catalog-filters__open,
  .catalog-filters__dialog {
    display: none;
  }
  .catalog-filters__desktop {
    display: block;
    position: sticky;
    top: 5.5rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }
}
</style>
