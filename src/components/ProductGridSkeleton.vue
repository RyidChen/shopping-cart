<!-- 商品載入中的骨架畫面 -->
<template>
  <!-- aria-busy 告知輔助工具商品仍在載入；內部卡片僅是視覺佔位。 -->
  <section
    class="product-grid-skeleton"
    aria-label="商品載入中"
    aria-busy="true"
  >
    <article
      v-for="index in 8"
      :key="index"
      class="product-grid-skeleton__card"
      aria-hidden="true"
    >
      <span class="product-grid-skeleton__image" />
      <span
        class="product-grid-skeleton__line product-grid-skeleton__line--short"
      />
      <span class="product-grid-skeleton__line" />
      <span
        class="product-grid-skeleton__line product-grid-skeleton__line--medium"
      />
    </article>
  </section>
</template>

<style scoped>
.product-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.product-grid-skeleton__card {
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.product-grid-skeleton__image,
.product-grid-skeleton__line {
  display: block;
  border-radius: 0.35rem;
  background: linear-gradient(
    90deg,
    var(--color-sand),
    #f4efe6,
    var(--color-sand)
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}
.product-grid-skeleton__image {
  aspect-ratio: 4 / 5;
}
.product-grid-skeleton__line {
  width: 100%;
  height: 0.8rem;
}
.product-grid-skeleton__line--short {
  width: 38%;
}
.product-grid-skeleton__line--medium {
  width: 58%;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
@media (min-width: 48rem) {
  .product-grid-skeleton {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (min-width: 64rem) {
  .product-grid-skeleton {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .product-grid-skeleton__image,
  .product-grid-skeleton__line {
    animation: none;
  }
}
</style>
