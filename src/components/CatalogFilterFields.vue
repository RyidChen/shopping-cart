<script setup lang="ts">
import type { ProductFilters } from "../types/commerce";

// 父層持有真正的篩選狀態；此元件只呈現控制項並回傳使用者操作。
defineProps<{ filters: ProductFilters; categories: string[] }>();
const emit = defineEmits<{
  update: [changes: Record<string, string>];
  reset: [];
}>();

// 將各欄位統一轉成局部變更，交由父層集中同步查詢參數與商品資料。
const update = (
  event: Event,
  key: "q" | "category" | "min" | "max" | "sort",
) => {
  emit("update", {
    [key]: (event.target as HTMLInputElement | HTMLSelectElement).value,
  });
};
</script>

<template>
  <div class="filter-fields">
    <label>
      搜尋商品
      <input
        :value="filters.search"
        type="search"
        placeholder="名稱或品牌"
        @input="update($event, 'q')"
      />
    </label>
    <label>
      分類
      <select :value="filters.category" @change="update($event, 'category')">
        <option value="">全部分類</option>
        <option
          v-for="category in categories"
          :key="category"
          :value="category"
        >
          {{ category }}
        </option>
      </select>
    </label>
    <label>
      最低價格
      <input
        :value="filters.minPrice ?? ''"
        type="number"
        min="0"
        inputmode="numeric"
        @input="update($event, 'min')"
      />
    </label>
    <label>
      最高價格
      <input
        :value="filters.maxPrice ?? ''"
        type="number"
        min="0"
        inputmode="numeric"
        @input="update($event, 'max')"
      />
    </label>
    <label>
      排序
      <select :value="filters.sort" @change="update($event, 'sort')">
        <option value="newest">最新上架</option>
        <option value="price-asc">價格由低到高</option>
        <option value="price-desc">價格由高到低</option>
      </select>
    </label>
    <button class="filter-fields__reset" type="button" @click="emit('reset')">
      清除條件
    </button>
  </div>
</template>

<style scoped>
.filter-fields {
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
.filter-fields__reset {
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-ink);
  background: var(--color-surface);
  font-weight: 600;
}
</style>
