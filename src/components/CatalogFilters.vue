<script setup lang="ts">
import { ref } from "vue";
import type { ProductFilters, ProductSort } from "../types/commerce";

defineProps<{ filters: ProductFilters; categories: string[] }>();
const emit = defineEmits<{
  update: [changes: Record<string, string>];
  reset: [];
}>();
const dialog = ref<HTMLDialogElement>();

const update = (
  event: Event,
  key: "q" | "category" | "min" | "max" | "sort",
) => {
  emit("update", {
    [key]: (event.target as HTMLInputElement | HTMLSelectElement).value,
  });
};

const openDialog = () => dialog.value?.showModal?.();
</script>

<template>
  <div class="catalog-filters">
    <button class="catalog-filters__open" type="button" @click="openDialog">
      篩選與排序
    </button>
    <aside class="catalog-filters__desktop" aria-label="商品篩選">
      <div class="catalog-filters__controls">
        <label
          >搜尋商品<input
            :value="filters.search"
            type="search"
            placeholder="名稱或品牌"
            @input="update($event, 'q')"
        /></label>
        <label
          >分類<select
            id="catalog-category"
            :value="filters.category"
            @change="update($event, 'category')"
          >
            <option value="">全部分類</option>
            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select></label
        >
        <label
          >最低價格<input
            :value="filters.minPrice ?? ''"
            type="number"
            min="0"
            inputmode="numeric"
            @input="update($event, 'min')"
        /></label>
        <label
          >最高價格<input
            :value="filters.maxPrice ?? ''"
            type="number"
            min="0"
            inputmode="numeric"
            @input="update($event, 'max')"
        /></label>
        <label
          >排序<select :value="filters.sort" @change="update($event, 'sort')">
            <option value="newest">最新上架</option>
            <option value="price-asc">價格由低到高</option>
            <option value="price-desc">價格由高到低</option>
          </select></label
        >
        <button
          class="catalog-filters__reset"
          type="button"
          @click="emit('reset')"
        >
          清除條件
        </button>
      </div>
    </aside>
    <dialog ref="dialog" class="catalog-filters__dialog" aria-label="商品篩選">
      <form method="dialog" class="catalog-filters__dialog-header">
        <strong>篩選與排序</strong
        ><button type="submit" aria-label="關閉篩選">關閉</button>
      </form>
      <div class="catalog-filters__controls">
        <label
          >搜尋商品<input
            :value="filters.search"
            type="search"
            placeholder="名稱或品牌"
            @input="update($event, 'q')"
        /></label>
        <label
          >分類<select
            :value="filters.category"
            @change="update($event, 'category')"
          >
            <option value="">全部分類</option>
            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select></label
        >
        <label
          >最低價格<input
            :value="filters.minPrice ?? ''"
            type="number"
            min="0"
            inputmode="numeric"
            @input="update($event, 'min')"
        /></label>
        <label
          >最高價格<input
            :value="filters.maxPrice ?? ''"
            type="number"
            min="0"
            inputmode="numeric"
            @input="update($event, 'max')"
        /></label>
        <label
          >排序<select :value="filters.sort" @change="update($event, 'sort')">
            <option value="newest">最新上架</option>
            <option value="price-asc">價格由低到高</option>
            <option value="price-desc">價格由高到低</option>
          </select></label
        >
        <button
          class="catalog-filters__reset"
          type="button"
          @click="
            emit('reset');
            dialog?.close();
          "
        >
          清除條件
        </button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.catalog-filters__open,
.catalog-filters__reset,
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
.catalog-filters__controls {
  display: grid;
  gap: 1rem;
}
label {
  display: grid;
  gap: 0.4rem;
  color: var(--color-muted);
  font-size: 0.875rem;
  font-weight: 600;
}
input,
select {
  width: 100%;
  min-height: 44px;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-ink);
  background: var(--color-surface);
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
  }
  .catalog-filters__desktop {
    position: sticky;
    top: 5.5rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }
}
</style>
