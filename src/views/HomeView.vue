<script setup lang="ts">
import { computed, ref } from "vue";
import ProductCard from "../components/ProductCard.vue";
import ProductGridSkeleton from "../components/ProductGridSkeleton.vue";
import { queryProducts } from "../services/productService";
import type { Product } from "../types/commerce";

const categories = [
  { name: "3C", note: "讓每日使用更順手" },
  { name: "居家", note: "留一個舒服的角落" },
  { name: "服飾", note: "輕鬆穿出自己的節奏" },
  { name: "美妝", note: "回到簡單有效的保養" },
];
const products = ref<Product[]>([]);
const loading = ref(true);
const failed = ref(false);
const featured = computed(() =>
  products.value.filter((product) => product.featured).slice(0, 4),
);
const newest = computed(() => products.value.slice(0, 4));

async function loadProducts() {
  loading.value = true;
  failed.value = false;
  try {
    products.value = (
      await queryProducts({
        search: "",
        category: "",
        sort: "newest",
        page: 1,
        pageSize: 12,
      })
    ).items;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

loadProducts();
</script>

<template>
  <main>
    <section class="home-hero">
      <div class="container home-hero__content">
        <p>Curio / selected objects</p>
        <h1>把日常，留給真正想一起生活的物件。</h1>
        <span>跨越品類的選物，為每個平凡時刻保留一點質感與餘裕。</span
        ><RouterLink to="/products">探索全部商品</RouterLink>
      </div>
    </section>
    <section class="home-section container" aria-labelledby="category-heading">
      <div class="home-section__heading">
        <p>Shop by category</p>
        <h2 id="category-heading">從需要開始，找到喜歡</h2>
      </div>
      <nav class="home-categories" aria-label="商品分類">
        <RouterLink
          v-for="category in categories"
          :key="category.name"
          :to="{ name: 'catalog', query: { category: category.name } }"
          ><strong>{{ category.name }}</strong
          ><span>{{ category.note }}</span></RouterLink
        >
      </nav>
    </section>
    <section class="home-section container" aria-labelledby="featured-heading">
      <div class="home-section__heading">
        <p>Editor's picks</p>
        <h2 id="featured-heading">精選商品</h2>
      </div>
      <ProductGridSkeleton v-if="loading" />
      <section v-else-if="failed" class="home-message" role="alert">
        <h2>載入商品失敗</h2>
        <p>暫時無法取得精選商品，請稍後再試。</p>
        <button type="button" @click="loadProducts">重試</button>
      </section>
      <div v-else class="home-grid">
        <ProductCard
          v-for="product in featured"
          :key="product.id"
          :product="product"
        />
      </div>
    </section>
    <section
      class="home-section home-section--sand"
      aria-labelledby="new-heading"
    >
      <div class="container">
        <div class="home-section__heading">
          <p>New arrivals</p>
          <h2 id="new-heading">最新上架</h2>
        </div>
        <div v-if="!loading && !failed" class="home-grid">
          <ProductCard
            v-for="product in newest"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-hero {
  padding-block: clamp(4rem, 12vw, 9rem);
  background: var(--color-sand);
}
.home-hero__content {
  display: grid;
  justify-items: start;
  max-width: 70rem;
}
.home-hero p,
.home-section__heading p {
  margin: 0 0 0.6rem;
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
  max-width: 14ch;
  font-size: clamp(3rem, 10vw, 6.5rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}
.home-hero span {
  max-width: 34rem;
  margin-top: 1.4rem;
  color: var(--color-muted);
  font-size: clamp(1rem, 2vw, 1.2rem);
}
.home-hero a,
.home-message button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  margin-top: 1.7rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-sm);
  color: var(--color-surface);
  background: var(--color-ink);
  font-weight: 600;
}
.home-section {
  padding-block: clamp(3rem, 8vw, 5.5rem);
}
.home-section--sand {
  background: var(--color-sand);
}
.home-section__heading {
  margin-bottom: 1.4rem;
}
h2 {
  font-size: clamp(2rem, 5vw, 3.25rem);
  line-height: 1.05;
  letter-spacing: -0.035em;
}
.home-categories,
.home-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.home-categories a {
  display: grid;
  min-height: 8.5rem;
  align-content: space-between;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition:
    transform var(--transition),
    box-shadow var(--transition);
}
.home-categories a:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}
.home-categories strong {
  font-family: var(--font-display);
  font-size: 1.5rem;
}
.home-categories span {
  color: var(--color-muted);
  font-size: 0.82rem;
}
.home-message {
  display: grid;
  justify-items: start;
  gap: 0.6rem;
  padding: 2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.home-message p {
  margin: 0;
  color: var(--color-muted);
}
.home-message button {
  margin-top: 0.3rem;
}
@media (min-width: 48rem) {
  .home-categories {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .home-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (min-width: 64rem) {
  .home-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .home-categories a:hover {
    transform: none;
  }
}
</style>
