<script setup lang="ts">
import type { Product } from "../types/commerce";
import { formatCurrency } from "../utils/format";

defineProps<{ product: Product }>();
</script>

<template>
  <article class="product-card">
    <RouterLink class="product-card__image" :to="`/products/${product.slug}`">
      <img :src="product.images[0]" :alt="product.name" loading="lazy" />
      <span v-if="product.inventory === 0" class="product-card__sold-out"
        >售完</span
      >
    </RouterLink>
    <div class="product-card__details">
      <p>{{ product.brand }}</p>
      <h2>
        <RouterLink :to="`/products/${product.slug}`">{{
          product.name
        }}</RouterLink>
      </h2>
      <div class="product-card__meta">
        <strong>{{ formatCurrency(product.price) }}</strong>
        <span
          :class="
            product.inventory
              ? 'product-card__stock--available'
              : 'product-card__stock--empty'
          "
          >{{
            product.inventory ? `尚有 ${product.inventory} 件` : "目前缺貨"
          }}</span
        >
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow var(--transition),
    transform var(--transition);
}
.product-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.product-card__image {
  position: relative;
  display: block;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--color-sand);
}
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 250ms ease;
}
.product-card:hover img {
  transform: scale(1.025);
}
.product-card__sold-out {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  border-radius: 100vmax;
  padding: 0.25rem 0.6rem;
  color: var(--color-surface);
  background: rgb(26 25 23 / 88%);
  font-size: 0.75rem;
  font-weight: 700;
}
.product-card__details {
  display: grid;
  gap: 0.3rem;
  padding: 1rem;
}
p,
h2 {
  margin: 0;
}
p {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h2 {
  font-size: 1rem;
  line-height: 1.35;
}
h2 a {
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}
.product-card__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.4rem;
}
strong {
  font-size: 0.95rem;
}
.product-card__stock--available,
.product-card__stock--empty {
  font-size: 0.75rem;
  white-space: nowrap;
}
.product-card__stock--available {
  color: var(--color-success);
}
.product-card__stock--empty {
  color: var(--color-danger);
}
@media (prefers-reduced-motion: reduce) {
  .product-card:hover {
    transform: none;
  }
  .product-card:hover img {
    transform: none;
  }
}
</style>
