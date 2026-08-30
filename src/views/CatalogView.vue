<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import CatalogFilters from "../components/CatalogFilters.vue";
import EmptyState from "../components/EmptyState.vue";
import ProductCard from "../components/ProductCard.vue";
import ProductGridSkeleton from "../components/ProductGridSkeleton.vue";
import { queryProducts } from "../services/productService";
import type { CatalogResult } from "../types/commerce";
import { parseCatalogQuery } from "../utils/catalog";

const route = useRoute();
const router = useRouter();
const categories = ["3C", "居家", "服飾", "美妝", "配件"];
const filters = computed(() => parseCatalogQuery(route.query));
const result = ref<CatalogResult>();
const loading = ref(false);
const failed = ref(false);
let requestId = 0;

async function loadProducts() {
  const id = ++requestId;
  loading.value = true;
  failed.value = false;
  try {
    const request = queryProducts(filters.value);
    const response = await request;
    if (id === requestId && filters.value.page > response.totalPages) {
      router.replace({
        query: { ...route.query, page: String(response.totalPages) },
      });
      return;
    }
    if (id === requestId) result.value = response;
  } catch {
    if (id === requestId) failed.value = true;
  } finally {
    if (id === requestId) loading.value = false;
  }
}

function updateQuery(changes: Record<string, string>) {
  const query = { ...route.query } as Record<string, string>;
  if (!("page" in changes)) delete query.page;
  for (const [key, value] of Object.entries(changes))
    value ? (query[key] = value) : delete query[key];
  router.replace({ query });
}

function changePage(page: number) {
  updateQuery({ page: String(page) });
}

watch(
  () => route.fullPath,
  () => {
    void loadProducts();
  },
  { immediate: true },
);
</script>

<template>
  <main class="catalog container">
    <header class="catalog__intro">
      <p>Curio catalog</p>
      <h1>留給日常的好設計</h1>
      <span>從實用物件到剛好的小細節，慢慢挑選。</span>
    </header>
    <div class="catalog__layout">
      <CatalogFilters
        :filters="filters"
        :categories="categories"
        @update="updateQuery"
        @reset="router.replace({ query: {} })"
      />
      <section class="catalog__results" aria-live="polite">
        <ProductGridSkeleton v-if="loading" />
        <section v-else-if="failed" class="catalog__message" role="alert">
          <h2>載入商品失敗</h2>
          <p>目前無法取得商品，請稍後再試。</p>
          <button type="button" @click="loadProducts">重試</button>
        </section>
        <EmptyState
          v-else-if="!result || !result.items.length"
          title="找不到符合條件的商品"
          message="調整搜尋或篩選條件，看看其他精選商品。"
          ><button type="button" @click="router.replace({ query: {} })">
            清除條件
          </button></EmptyState
        >
        <template v-else>
          <p class="catalog__count">共 {{ result.total }} 件商品</p>
          <div class="catalog__grid">
            <ProductCard
              v-for="product in result.items"
              :key="product.id"
              :product="product"
            />
          </div>
          <nav
            v-if="result.totalPages > 1"
            class="catalog__pagination"
            aria-label="商品分頁"
          >
            <button
              type="button"
              :disabled="filters.page === 1"
              @click="changePage(filters.page - 1)"
            >
              上一頁</button
            ><span>第 {{ filters.page }} / {{ result.totalPages }} 頁</span
            ><button
              type="button"
              :disabled="filters.page === result.totalPages"
              @click="changePage(filters.page + 1)"
            >
              下一頁
            </button>
          </nav>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.catalog {
  padding-block: clamp(2rem, 6vw, 4rem);
}
.catalog__intro {
  max-width: 42rem;
  margin-bottom: 2rem;
}
.catalog__intro p {
  margin: 0 0 0.5rem;
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
h1,
h2 {
  margin: 0;
  font-family: var(--font-display);
}
h1 {
  font-size: clamp(2.35rem, 7vw, 4.5rem);
  line-height: 1.02;
  letter-spacing: -0.04em;
}
.catalog__intro span {
  display: block;
  margin-top: 0.9rem;
  color: var(--color-muted);
}
.catalog__layout {
  display: grid;
  gap: 1.25rem;
}
.catalog__results {
  min-width: 0;
}
.catalog__count {
  margin: 0 0 1rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}
.catalog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.catalog__message {
  display: grid;
  gap: 0.8rem;
  justify-items: start;
  padding: 2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.catalog__message p {
  margin: 0;
  color: var(--color-muted);
}
.catalog__message button,
.catalog__pagination button,
:deep(.empty-state button) {
  min-height: 44px;
  padding-inline: 1rem;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-sm);
  color: var(--color-surface);
  background: var(--color-ink);
  font-weight: 600;
}
.catalog__pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
}
.catalog__pagination button:disabled {
  opacity: 0.45;
}
@media (min-width: 48rem) {
  .catalog__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (min-width: 64rem) {
  .catalog__layout {
    grid-template-columns: minmax(15rem, 18rem) minmax(0, 1fr);
    align-items: start;
    gap: 2rem;
  }
  .catalog__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
