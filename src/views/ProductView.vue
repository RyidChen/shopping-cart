<!-- 商品詳情、規格選擇、庫存、加入購物車 -- 詳情頁 -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";
import { useRoute } from "vue-router";
import BaseButton from "../components/BaseButton.vue";
import QuantityControl from "../components/QuantityControl.vue";
import { getProductBySlug } from "../services/productService";
import { useCartStore } from "../stores/cart";
import type { Product } from "../types/commerce";
import { missingOptionNames } from "../utils/catalog";
import { formatCurrency } from "../utils/format";

const route = useRoute();
const cart = useCartStore();
const product = ref<Product | null>();
const loading = ref(true);
const failed = ref(false);
const selectedImage = ref(0);
const selectedOptions = ref<Record<string, string>>({});
const quantity = ref(1);
const optionError = ref("");
const successMessage = ref("");
const optionGroups = new Map<string, HTMLElement>();
let requestId = 0;

const missingOptions = computed(() =>
  product.value
    ? missingOptionNames(product.value.options, selectedOptions.value)
    : [],
);

const setOptionGroup = (
  name: string,
  element: Element | ComponentPublicInstance | null,
) => {
  if (element instanceof HTMLElement) optionGroups.set(name, element);
  else optionGroups.delete(name);
};

const loadProduct = async () => {
  const currentRequest = ++requestId;
  loading.value = true;
  failed.value = false;
  product.value = undefined;
  selectedImage.value = 0;
  selectedOptions.value = {};
  quantity.value = 1;
  optionError.value = "";
  successMessage.value = "";

  try {
    const result = await getProductBySlug(String(route.params.slug ?? ""));
    if (currentRequest === requestId) product.value = result;
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
};

const addToCart = async () => {
  if (!product.value || product.value.inventory === 0) return;
  const missing = missingOptions.value;
  if (missing.length) {
    optionError.value = `請選擇：${missing[0]}`;
    await nextTick();
    optionGroups.get(missing[0])?.focus();
    return;
  }

  cart.addItem(product.value, selectedOptions.value, quantity.value);
  optionError.value = "";
  successMessage.value = "已加入購物車";
};

watch(() => route.params.slug, loadProduct, { immediate: true });
</script>

<template>
  <main class="product-view">
    <section
      v-if="loading"
      class="container product-view__message"
      aria-busy="true"
      aria-label="商品載入中"
    >
      <p>商品載入中…</p>
    </section>

    <section
      v-else-if="failed"
      class="container product-view__message"
      role="alert"
    >
      <p>載入商品失敗，請稍後再試。</p>
      <BaseButton @click="loadProduct">重試</BaseButton>
    </section>

    <section v-else-if="!product" class="container product-view__message">
      <h1>找不到這項商品</h1>
      <p>這項商品可能已下架，或網址不正確。</p>
      <RouterLink to="/products">瀏覽所有商品</RouterLink>
    </section>

    <article v-else class="container product-view__layout">
      <section class="product-view__gallery" aria-label="商品圖片">
        <img
          class="product-view__main-image"
          :src="product.images[selectedImage]"
          :alt="product.name"
        />
        <div
          v-if="product.images.length > 1"
          class="product-view__thumbnails"
          aria-label="選擇商品圖片"
        >
          <button
            v-for="(image, index) in product.images"
            :key="image"
            type="button"
            :aria-label="`查看圖片 ${index + 1}`"
            :aria-pressed="selectedImage === index"
            @click="selectedImage = index"
          >
            <img :src="image" :alt="`${product.name} 圖片 ${index + 1}`" />
          </button>
        </div>
      </section>

      <section class="product-view__details">
        <p class="product-view__eyebrow">
          {{ product.brand }} · {{ product.category }}
        </p>
        <h1>{{ product.name }}</h1>
        <p class="product-view__price">{{ formatCurrency(product.price) }}</p>
        <p v-if="product.compareAtPrice" class="product-view__compare">
          原價 {{ formatCurrency(product.compareAtPrice) }}
        </p>
        <p class="product-view__description">{{ product.description }}</p>
        <ul
          v-if="product.tags.length"
          class="product-view__tags"
          aria-label="商品標籤"
        >
          <li v-for="tag in product.tags" :key="tag">{{ tag }}</li>
        </ul>

        <form
          class="product-view__purchase"
          novalidate
          @submit.prevent="addToCart"
        >
          <p
            class="product-view__stock"
            :class="
              product.inventory
                ? 'product-view__stock--available'
                : 'product-view__stock--empty'
            "
          >
            {{
              product.inventory
                ? `庫存尚有 ${product.inventory} 件`
                : "目前缺貨"
            }}
          </p>

          <fieldset
            v-for="option in product.options"
            :key="option.name"
            :ref="(element) => setOptionGroup(option.name, element)"
            class="product-view__option"
            role="radiogroup"
            aria-required="true"
            tabindex="-1"
            :aria-describedby="
              optionError && missingOptions.includes(option.name)
                ? `${option.name}-error`
                : undefined
            "
          >
            <legend>{{ option.name }}</legend>
            <div class="product-view__option-values">
              <label
                v-for="(value, index) in option.values"
                :key="value"
                :for="`${option.name}-${index}`"
              >
                <input
                  :id="`${option.name}-${index}`"
                  v-model="selectedOptions[option.name]"
                  type="radio"
                  :name="option.name"
                  :value="value"
                />
                <span>{{ value }}</span>
              </label>
            </div>
            <p
              v-if="optionError && missingOptions.includes(option.name)"
              :id="`${option.name}-error`"
              class="product-view__option-error"
            >
              {{ optionError }}
            </p>
          </fieldset>

          <div v-if="product.inventory" class="product-view__quantity">
            <span>數量</span>
            <QuantityControl v-model="quantity" :max="product.inventory" />
          </div>

          <p v-if="optionError" class="product-view__form-error" role="alert">
            {{ optionError }}
          </p>
          <p v-if="successMessage" class="product-view__success" role="status">
            {{ successMessage }}
          </p>
          <BaseButton
            class="product-view__submit"
            type="submit"
            :disabled="product.inventory === 0"
          >
            {{ product.inventory ? "加入購物車" : "暫時缺貨" }}
          </BaseButton>
        </form>
      </section>
    </article>
  </main>
</template>

<style scoped>
.product-view {
  padding-block: clamp(2rem, 5vw, 4rem);
}
.product-view__message {
  display: grid;
  justify-items: start;
  gap: 1rem;
  padding-block: 4rem;
}
.product-view__message h1,
.product-view__message p {
  margin: 0;
}
.product-view__message h1,
h1 {
  font-family: var(--font-display);
}
.product-view__message a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-sm);
  padding: 0.65rem 1rem;
  color: var(--color-surface);
  background: var(--color-ink);
  font-weight: 600;
}
.product-view__layout {
  display: grid;
  gap: clamp(2rem, 6vw, 5rem);
}
.product-view__gallery {
  min-width: 0;
}
.product-view__main-image {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-lg);
  background: var(--color-sand);
  object-fit: cover;
}
.product-view__thumbnails {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}
.product-view__thumbnails button {
  width: 4rem;
  height: 4rem;
  flex: 0 0 auto;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0;
  background: var(--color-sand);
}
.product-view__thumbnails button[aria-pressed="true"] {
  border-color: var(--color-ink);
}
.product-view__thumbnails img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-view__details {
  min-width: 0;
}
.product-view__eyebrow,
.product-view__compare {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
h1 {
  margin: 0.35rem 0 1rem;
  font-size: clamp(2.25rem, 5vw, 4rem);
  line-height: 1.05;
}
.product-view__price {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}
.product-view__compare {
  margin-top: 0.25rem;
  text-decoration: line-through;
}
.product-view__description {
  max-width: 42rem;
  margin: 1.5rem 0;
  color: var(--color-muted);
}
.product-view__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.product-view__tags li {
  border-radius: 100vmax;
  padding: 0.3rem 0.65rem;
  background: var(--color-sand);
  font-size: 0.8rem;
}
.product-view__purchase {
  display: grid;
  gap: 1.25rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}
.product-view__stock {
  margin: 0;
  font-weight: 700;
}
.product-view__stock--available {
  color: var(--color-success);
}
.product-view__stock--empty,
.product-view__option-error,
.product-view__form-error {
  color: var(--color-danger);
}
.product-view__option {
  min-width: 0;
  margin: 0;
  border: 0;
  padding: 0;
}
.product-view__option legend,
.product-view__quantity > span {
  padding: 0;
  font-weight: 700;
}
.product-view__option-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.7rem;
}
.product-view__option-values label {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
}
.product-view__option-values input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--color-ink);
}
.product-view__option-error,
.product-view__form-error,
.product-view__success {
  margin: 0.6rem 0 0;
  font-size: 0.9rem;
}
.product-view__quantity {
  display: grid;
  justify-items: start;
  gap: 0.7rem;
}
.product-view__success {
  color: var(--color-success);
  font-weight: 700;
}
.product-view__submit {
  width: 100%;
}
@media (min-width: 48rem) {
  .product-view__layout {
    grid-template-columns: minmax(0, 1.05fr) minmax(20rem, 0.95fr);
    align-items: start;
  }
  .product-view__details {
    padding-top: 1rem;
  }
  .product-view__submit {
    width: auto;
    min-width: 14rem;
  }
}
</style>
