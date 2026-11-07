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
import { computed, onMounted, onUnmounted, ref } from "vue";
import arcKeyboardHero from "../assets/products/arc-keyboard-hero.webp";
import auraHeadphonesHero from "../assets/products/aura-headphones-hero.png";
import haloLampHero from "../assets/products/halo-lamp-hero.webp";
import ProductCard from "../components/ProductCard.vue";
import ProductGridSkeleton from "../components/ProductGridSkeleton.vue";
import { queryProducts } from "../services/productService";
import type { Product } from "../types/commerce";

const heroSlides = [
  {
    slug: "aura-headphones",
    brand: "Aster",
    name: "Aura 無線耳機",
    headline: "新品上市",
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
    headline: "居家精選",
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
    headline: "桌面選物",
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
let rotationTimer: number | undefined;

// 手動換頁後重新計時，讓選到的商品完整顯示 5 秒。
function startHeroRotation() {
  window.clearInterval(rotationTimer);
  rotationTimer = window.setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % heroSlides.length;
  }, 5000);
}

onMounted(startHeroRotation);
onUnmounted(() => window.clearInterval(rotationTimer));

function selectSlide(index: number) {
  activeSlide.value = index;
  announcedSlide.value = heroSlides[index].name;
  startHeroRotation();
}

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
    <section
      class="home-hero"
      aria-labelledby="home-hero-heading"
      aria-roledescription="輪播"
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
              <p class="home-hero__eyebrow">
                {{ slide.brand }} / {{ slide.name }}
              </p>
              <h2>{{ slide.headline }}</h2>
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
              <svg
                class="home-hero__contours"
                viewBox="0 0 640 480"
                fill="none"
                aria-hidden="true"
              >
                <g stroke="currentColor" stroke-width="1">
                  <path d="M245-28C174 73 297 118 241 211S65 316 91 500" />
                  <path
                    d="M287-28C209 78 333 133 276 224S110 332 135 500"
                    stroke-dasharray="5 9"
                  />
                  <path d="M332-28C248 91 372 150 311 241S156 345 182 500" />
                  <path d="M382-28C285 104 409 165 345 257S208 354 229 500" />
                  <path
                    d="M441-28C339 95 451 177 384 274S258 371 281 500"
                    stroke-dasharray="5 9"
                  />
                  <path d="M513-28C403 71 496 192 426 289S312 381 335 500" />
                  <path d="M590-28C481 53 543 205 471 308S370 393 395 500" />
                  <path
                    d="M656 8C558 63 594 232 516 325S424 406 458 500"
                    stroke-dasharray="5 9"
                  />
                  <path d="M659 101C610 147 631 260 563 343S492 421 518 500" />
                </g>
              </svg>
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
.home-hero__eyebrow {
  margin: 0 0 0.85rem;
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
h2 {
  margin: 0;
  font-family: var(--font-display);
}
.home-hero__content h2 {
  font-family: var(--font-body);
  font-size: clamp(1.75rem, 4.55vw, 3.75rem);
  font-weight: 750;
  line-height: 1.18;
  letter-spacing: -0.035em;
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
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  min-width: 0;
}
.home-hero__contours {
  position: absolute;
  z-index: -1;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--color-muted);
  opacity: 0.23;
  mask-image: radial-gradient(ellipse, #000 35%, transparent 75%);
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
  .home-hero__layout {
    transition: none;
  }
  .home-categories a:hover {
    transform: none;
  }
}
</style>
