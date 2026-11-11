<!-- 主入口 -->
<script setup lang="ts">
import {
  ArrowUpRight,
  Headphones,
  Keyboard,
  LampDesk,
  Lightbulb,
  VolumeX,
} from "@lucide/vue";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import arcKeyboardHero from "../assets/products/arc-keyboard-hero.webp";
import auraHeadphonesHero from "../assets/products/aura-headphones-hero.png";
import haloLampHero from "../assets/products/halo-lamp-hero.webp";
import ProductCard from "../components/ProductCard.vue";
import ProductGridSkeleton from "../components/ProductGridSkeleton.vue";
import {
  getProductCategories,
  queryProducts,
} from "../services/productService";
import type { Product } from "../types/commerce";
import { formatCurrency } from "../utils/format";

const heroSlides = [
  {
    slug: "aura-headphones",
    brand: "Aster",
    name: "Aura 無線耳機",
    description:
      "Aura 無線耳機採用包覆式耳罩，搭配降噪設計，適合通勤與日常聆聽。",
    image: auraHeadphonesHero,
    features: [
      { icon: VolumeX, text: "降噪設計" },
      { icon: Headphones, text: "包覆式耳罩" },
    ],
  },
  {
    slug: "halo-lamp",
    brand: "Luma",
    name: "Halo 桌燈",
    description: "Halo 環形桌燈提供暖白光，適合擺在床邊或工作桌。",
    image: haloLampHero,
    features: [
      { icon: Lightbulb, text: "暖白光" },
      { icon: LampDesk, text: "環形燈架" },
    ],
  },
  {
    slug: "arc-keyboard",
    brand: "Aster",
    name: "Arc 機械鍵盤",
    description: "Arc 機械鍵盤採用緊湊配置與靜音線性軸，搭配木質外框。",
    image: arcKeyboardHero,
    features: [
      { icon: Keyboard, text: "緊湊配置" },
      { icon: VolumeX, text: "靜音線性軸" },
    ],
  },
];
const activeSlide = ref(0);
const announcedSlide = ref("");
const heroHovered = ref(false);
const heroFocused = ref(false);
let rotationTimer: number | undefined;

// 滑鼠與鍵盤焦點都離開後，才重新計時完整的 5 秒。
function startHeroRotation() {
  window.clearInterval(rotationTimer);
  if (heroHovered.value || heroFocused.value) return;
  rotationTimer = window.setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % heroSlides.length;
  }, 5000);
}

onMounted(startHeroRotation);
onUnmounted(() => window.clearInterval(rotationTimer));
watch([heroHovered, heroFocused], startHeroRotation, { flush: "sync" });

function onHeroFocusOut(event: FocusEvent) {
  heroFocused.value =
    event.relatedTarget instanceof Node &&
    (event.currentTarget as HTMLElement).contains(event.relatedTarget);
}

function selectSlide(index: number) {
  activeSlide.value = index;
  announcedSlide.value = heroSlides[index].name;
  startHeroRotation();
}

const categories = ref<{ name: string; count: number }[]>([]);
const products = ref<Product[]>([]);
const loading = ref(true);
const failed = ref(false);
// 首頁只保留一組精選商品，完整型錄由商品列表提供。
const featured = computed(() =>
  products.value.filter((product) => product.featured).slice(0, 4),
);
const deskSelections = [
  { slug: "arc-keyboard", note: "木質外框搭配靜音線性軸，適合日常打字。" },
  { slug: "halo-lamp", note: "暖白光，放在工作桌或床邊都合適。" },
  { slug: "sono-speaker", note: "小巧的藍牙喇叭，讓音樂也有一個位置。" },
];
const deskProducts = computed(() =>
  deskSelections.flatMap((selection) => {
    const product = products.value.find((item) => item.slug === selection.slug);
    return product ? [{ ...product, selectionNote: selection.note }] : [];
  }),
);
const budgetProducts = computed(() =>
  products.value
    .filter((product) => product.price <= 2000 && product.inventory > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 3),
);

async function loadProducts() {
  loading.value = true;
  failed.value = false;
  try {
    const [result, categoryCounts] = await Promise.all([
      queryProducts({
        search: "",
        category: "",
        sort: "newest",
        page: 1,
        pageSize: 12,
      }),
      getProductCategories(),
    ]);
    products.value = result.items;
    categories.value = categoryCounts;
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
    <section
      class="home-hero"
      aria-labelledby="home-hero-heading"
      aria-roledescription="輪播"
      @mouseenter="heroHovered = true"
      @mouseleave="heroHovered = false"
      @focusin="heroFocused = true"
      @focusout="onHeroFocusOut"
    >
      <h1 id="home-hero-heading" class="sr-only">Curio 日常選物</h1>
      <div class="container home-hero__frame">
        <div class="home-hero__controls" role="group" aria-label="輪播控制">
          <button
            v-for="(slide, index) in heroSlides"
            :key="slide.slug"
            class="home-hero__dot"
            type="button"
            :aria-label="`顯示${slide.name}`"
            :aria-current="index === activeSlide ? 'true' : undefined"
            @click="selectSlide(index)"
          >
            <span aria-hidden="true"></span>
          </button>
        </div>
        <p class="sr-only" aria-live="polite">
          {{ announcedSlide }}
        </p>
        <div class="home-hero__slides">
          <!-- 疊放三張投影片來固定版面高度，並讓鍵盤只能進入目前這張。 -->
          <div
            v-for="(slide, index) in heroSlides"
            :key="slide.slug"
            class="home-hero__layout"
            :class="{ 'home-hero__layout--active': index === activeSlide }"
            :inert="index !== activeSlide"
            :aria-hidden="index !== activeSlide || undefined"
          >
            <div class="home-hero__content">
              <h2>{{ slide.name }}</h2>
              <p class="home-hero__brand">{{ slide.brand }}</p>
              <p class="home-hero__description">{{ slide.description }}</p>
              <ul class="home-hero__features">
                <li v-for="feature in slide.features" :key="feature.text">
                  <component :is="feature.icon" :size="18" aria-hidden="true" />
                  {{ feature.text }}
                </li>
              </ul>
              <div class="home-hero__actions">
                <RouterLink
                  class="home-hero__action"
                  :to="{ name: 'product', params: { slug: slide.slug } }"
                >
                  查看商品 <ArrowUpRight :size="17" aria-hidden="true" />
                </RouterLink>
                <RouterLink
                  class="home-hero__action home-hero__action--secondary"
                  :to="{ name: 'catalog' }"
                >
                  瀏覽全部商品
                </RouterLink>
              </div>
            </div>
            <div class="home-hero__visual">
              <img
                :src="slide.image"
                :alt="slide.name"
                :fetchpriority="index === 0 ? 'high' : 'low'"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
    <section
      v-if="categories.length"
      class="home-section container"
      aria-labelledby="category-heading"
    >
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
          <span>{{ category.count }} 件</span>
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
      v-if="!loading && !failed && deskProducts.length"
      class="home-section home-desk"
      aria-labelledby="desk-heading"
    >
      <div class="container home-desk__layout">
        <header class="home-section__heading">
          <h2 id="desk-heading">工作桌上的選物</h2>
          <p class="home-section__intro">鍵盤、照明與音樂，各自留一個位置。</p>
        </header>
        <div class="home-desk__picks">
          <RouterLink
            v-for="product in deskProducts"
            :key="product.id"
            class="desk-pick"
            :to="{ name: 'product', params: { slug: product.slug } }"
          >
            <img
              class="desk-pick__image"
              :src="product.images[0]"
              :alt="product.name"
              loading="lazy"
              width="800"
              height="1000"
            />
            <div class="desk-pick__details">
              <h3>{{ product.name }}</h3>
              <p>{{ product.selectionNote }}</p>
              <strong>{{ formatCurrency(product.price) }}</strong>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>
    <section
      v-if="!loading && !failed && budgetProducts.length"
      class="home-section home-budget container"
      aria-labelledby="budget-heading"
    >
      <header class="home-section__heading home-budget__heading">
        <h2 id="budget-heading">NT$2,000 以內</h2>
        <RouterLink
          class="home-budget__all"
          :to="{ name: 'catalog', query: { max: '2000' } }"
          aria-label="查看全部 NT$2,000 以內商品"
        >
          查看全部
        </RouterLink>
      </header>
      <ul class="home-budget__items">
        <li v-for="product in budgetProducts" :key="product.id">
          <RouterLink :to="{ name: 'product', params: { slug: product.slug } }">
            <img
              :src="product.images[0]"
              :alt="product.name"
              loading="lazy"
              width="160"
              height="160"
            />
            <div>
              <h3>{{ product.name }}</h3>
              <strong>{{ formatCurrency(product.price) }}</strong>
            </div>
          </RouterLink>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.home-hero {
  padding-block: clamp(1.75rem, 4vw, 3rem);
  background: linear-gradient(110deg, var(--color-bg), var(--color-sand));
  border-bottom: 1px solid var(--color-border);
}
.home-hero__frame {
  display: grid;
  grid-template-areas: "slides" "controls";
  align-items: center;
  gap: 0.75rem;
}
.home-hero__slides {
  grid-area: slides;
  display: grid;
  min-width: 0;
}
.home-hero__layout {
  grid-area: 1 / 1;
  display: grid;
  align-items: center;
  gap: 1.5rem;
  opacity: 0;
  visibility: hidden;
  transform: translateX(0.65rem);
  transition:
    opacity 320ms ease,
    transform 320ms ease,
    visibility 320ms;
}
.home-hero__layout--active {
  opacity: 1;
  visibility: visible;
  transform: none;
}
.home-hero__brand {
  margin: 0.65rem 0 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}
h2 {
  margin: 0;
  font-family: var(--font-display);
}
.home-hero__content h2 {
  font-family: var(--font-body);
  font-size: clamp(1.75rem, 4.55vw, 3.25rem);
  font-weight: 750;
  line-height: 1.18;
  letter-spacing: -0.035em;
  text-wrap: balance;
  overflow-wrap: break-word;
  min-width: 0;
}
.home-hero__description {
  max-width: 26rem;
  margin: 1rem 0 0;
  color: var(--color-muted);
  line-height: 1.8;
}
.home-hero__features,
.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 1.25rem;
  margin: 1.3rem 0 0;
}
.home-hero__features {
  padding: 0;
  list-style: none;
  font-size: 0.875rem;
}
.home-hero__features li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.home-hero__features svg {
  color: var(--color-success);
}
.home-hero__actions {
  gap: 0.65rem;
}
.home-hero__action,
.home-message button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--color-surface);
  background: var(--color-ink);
  font-weight: 600;
}
.home-hero__action {
  font-size: 0.875rem;
}
.home-hero__action--secondary {
  color: var(--color-ink);
  background: var(--color-bg);
  border-color: var(--color-border);
}
.home-hero__action:hover {
  opacity: 0.8;
}
.home-hero__visual {
  display: grid;
  place-items: center;
  min-width: 0;
}
.home-hero__visual img {
  width: min(100%, 31rem);
  height: clamp(16rem, 36vw, 28rem);
  object-fit: contain;
  filter: drop-shadow(0 1rem 0.85rem rgb(26 25 23 / 14%));
}
.home-hero__controls {
  grid-area: controls;
  justify-self: center;
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.home-hero__controls button {
  display: grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: 0;
  border-radius: inherit;
  color: var(--color-muted);
  background: transparent;
}
.home-hero__controls button:hover {
  background: var(--color-bg);
}
.home-hero__dot span {
  width: 0.7rem;
  height: 0.7rem;
  border: 1px solid var(--color-muted);
  border-radius: 50%;
}
.home-hero__dot[aria-current="true"] span {
  border-color: var(--color-ink);
  background: var(--color-ink);
  outline: 1px solid var(--color-success);
  outline-offset: 3px;
}
.home-section {
  padding-block: clamp(2.5rem, 6vw, 4rem);
}
.home-section__heading {
  margin-bottom: 1.4rem;
}
.home-section__intro {
  margin: 0.65rem 0 0;
  color: var(--color-muted);
}
.home-desk {
  background: var(--color-sand);
}
.home-desk__picks {
  display: grid;
}
.desk-pick {
  min-width: 0;
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
  border-radius: var(--radius-sm);
  padding-block: 1.25rem;
}
.desk-pick__image {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
}
.desk-pick h3,
.home-budget h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.5;
}
.desk-pick__details p {
  margin: 0.5rem 0 0.75rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}
.desk-pick strong,
.home-budget strong {
  display: block;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
}
.desk-pick:hover h3,
.home-budget__items a:hover h3 {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.home-budget__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
}
.home-budget__all {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  text-decoration: underline;
  text-underline-offset: 0.25em;
  white-space: nowrap;
  font-size: 0.9rem;
}
.home-budget__all:hover {
  color: var(--color-muted);
}
.home-budget__items {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.home-budget__items li {
  min-width: 0;
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}
.home-budget__items a {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  border-radius: var(--radius-sm);
}
.home-budget__items img {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
}
.home-budget strong {
  margin-top: 0.5rem;
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
  display: flex;
  min-height: 5rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  transition: border-color var(--transition);
}
.home-categories a:hover {
  border-color: var(--color-muted);
}
.home-categories strong {
  font-size: 1.125rem;
  font-weight: 600;
}
.home-categories span {
  color: var(--color-muted);
  font-size: 0.82rem;
  white-space: nowrap;
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
  .home-desk__layout {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 2.1fr);
    align-items: start;
    gap: 2.5rem;
  }
  .home-desk .home-section__heading {
    margin: 1.25rem 0 0;
  }
  .desk-pick__details {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.35rem 1rem;
  }
  .desk-pick__details p {
    grid-column: 1;
    margin: 0;
  }
  .desk-pick__details strong {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    white-space: nowrap;
  }
  .home-budget__items {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
  }
  .home-budget__items a {
    grid-template-columns: 4rem minmax(0, 1fr);
  }
  .home-hero__frame {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "slides controls";
    gap: 1.25rem;
  }
  .home-hero__controls {
    flex-direction: column;
  }
  .home-hero__layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
    gap: 1rem;
  }
  .home-categories {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (min-width: 64rem) {
  .desk-pick {
    grid-template-columns: 7rem minmax(0, 1fr);
    gap: 1.5rem;
  }
  .home-budget__items a {
    grid-template-columns: 5.5rem minmax(0, 1fr);
  }
  .home-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .home-hero__layout {
    transition: none;
  }
}
</style>
