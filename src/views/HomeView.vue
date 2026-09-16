<!-- 主入口 -->
<script setup lang="ts">
import { computed, ref } from "vue";
import haloLamp from "../assets/products/halo-lamp.png";
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
// 精選商品 只顯示前四件，避免首頁過長；最新上架則直接取前四件。
const featured = computed(() =>
  products.value.filter((product) => product.featured).slice(0, 4),
);
const newest = computed(() => products.value.slice(0, 4));

async function loadProducts() {
  loading.value = true;
  failed.value = false;
  try {
    const result = await queryProducts({
      search: "",
      category: "",
      sort: "newest",
      page: 1,
      pageSize: 12,
    });
    products.value = result.items;
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
      <div class="container home-hero__layout">
        <div class="home-hero__content">
          <p class="home-hero__eyebrow">Curio 日常選物</p>
          <h1>好用，也喜歡。</h1>
          <p class="home-hero__description">
            一盞桌燈、一副耳機，從每天用得到的東西開始挑。
          </p>
          <RouterLink class="home-hero__action" to="/products">
            逛逛全部商品
          </RouterLink>
        </div>
        <RouterLink class="home-hero__feature" to="/products/halo-lamp">
          <img
            :src="haloLamp"
            alt="Halo 環形桌燈"
            width="800"
            height="1000"
            fetchpriority="high"
          />
          <span>
            Halo 桌燈
            <span aria-hidden="true">↗</span>
          </span>
        </RouterLink>
      </div>
    </section>
    <section class="home-section container" aria-labelledby="category-heading">
      <div class="home-section__heading">
        <h2 id="category-heading">依分類逛逛</h2>
      </div>
      <nav class="home-categories" aria-label="商品分類">
        <RouterLink
          v-for="category in categories"
          :key="category.name"
          :to="{ name: 'catalog', query: { category: category.name } }"
        >
          <strong>{{ category.name }}</strong>
          <span>{{ category.note }}</span>
        </RouterLink>
      </nav>
    </section>
    <section class="home-section container" aria-labelledby="featured-heading">
      <div class="home-section__heading">
        <h2 id="featured-heading">精選商品</h2>
      </div>
      <ProductGridSkeleton v-if="loading" />
      <section v-else-if="failed" class="home-message" role="alert">
        <h2>載入商品失敗</h2>
        <p>暫時無法取得精選商品，請稍後再試。</p>
        <button type="button" @click="loadProducts">重試</button>
      </section>
      <div v-else class="home-grid">
        <!-- 精選商品 -->
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
          <h2 id="new-heading">最新上架</h2>
        </div>
        <div v-if="!loading && !failed" class="home-grid">
          <!-- 最新上架商品 -->
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
  padding-block: clamp(2rem, 5vw, 4rem);
  background: var(--color-sand);
}
.home-hero__layout {
  display: grid;
  align-items: center;
  gap: 2rem;
}
.home-hero__content {
  display: grid;
  justify-items: start;
}
.home-hero__eyebrow {
  margin: 0 0 0.6rem;
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}
h1,
h2 {
  margin: 0;
  font-family: var(--font-display);
}
h1 {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.3;
  letter-spacing: -0.025em;
}
.home-hero__description {
  max-width: 24rem;
  margin: 1rem 0 0;
  color: var(--color-muted);
  font-size: 1rem;
  line-height: 1.8;
}
.home-hero__action,
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
.home-hero__feature {
  display: block;
  max-width: 28rem;
  width: 100%;
  justify-self: center;
}
.home-hero__feature img {
  width: 100%;
  height: auto;
  max-height: 25rem;
  object-fit: cover;
  border-radius: var(--radius-sm);
}
.home-hero__feature > span {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  font-size: 0.875rem;
}
.home-hero__feature:hover > span {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}
.home-section {
  padding-block: clamp(2.5rem, 6vw, 4rem);
}
.home-section--sand {
  background: var(--color-sand);
}
.home-section__heading {
  margin-bottom: 1.4rem;
}
h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1.4;
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
  .home-hero__layout {
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
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
