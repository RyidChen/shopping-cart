<!-- 修改數量、刪除商品、計算小計 -- 購物車-->
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import CheckoutLoginDialog from "../components/CheckoutLoginDialog.vue";
import EmptyState from "../components/EmptyState.vue";
import QuantityControl from "../components/QuantityControl.vue";
import { useCartStore } from "../stores/cart";
import { useAuthStore } from "../stores/auth";
import { formatCurrency } from "../utils/format";

const cart = useCartStore();
const auth = useAuthStore();
const router = useRouter();
const loginDialog = ref<InstanceType<typeof CheckoutLoginDialog> | null>(null);

function checkout() {
  if (!auth.user) {
    loginDialog.value?.show();
    return;
  }
  void router.push("/checkout");
}
</script>

<template>
  <main class="cart-view">
    <div class="container">
      <header class="cart-view__header">
        <p>您的選購</p>
        <h1>購物車</h1>
      </header>

      <EmptyState
        v-if="!cart.items.length"
        title="購物車是空的"
        message="還沒找到喜歡的商品？先去逛逛。"
        action-label="瀏覽商品"
        to="/products"
      />

      <div v-else class="cart-view__layout">
        <section aria-labelledby="cart-lines-title">
          <h2 id="cart-lines-title" class="sr-only">購物車商品</h2>
          <ul class="cart-view__lines">
            <li v-for="line in cart.items" :key="line.lineId" class="cart-line">
              <RouterLink
                class="cart-line__image"
                :to="{ name: 'product', params: { slug: line.slug } }"
              >
                <img :src="line.image" :alt="line.name" />
              </RouterLink>
              <div class="cart-line__details">
                <h2>
                  <RouterLink
                    :to="{ name: 'product', params: { slug: line.slug } }"
                  >
                    {{ line.name }}
                  </RouterLink>
                </h2>
                <dl
                  v-if="Object.keys(line.selectedOptions).length"
                  class="cart-line__options"
                >
                  <template
                    v-for="(value, name) in line.selectedOptions"
                    :key="name"
                  >
                    <dt>{{ name }}：</dt>
                    <dd>{{ value }}</dd>
                  </template>
                </dl>
                <p class="cart-line__unit-price">
                  單價 {{ formatCurrency(line.unitPrice) }}
                </p>
                <QuantityControl
                  :model-value="line.quantity"
                  :max="line.inventory"
                  @update:model-value="cart.setQuantity(line.lineId, $event)"
                />
              </div>
              <div class="cart-line__total">
                <p>{{ formatCurrency(line.unitPrice * line.quantity) }}</p>
                <button
                  type="button"
                  :aria-label="`移除 ${line.name}`"
                  @click="cart.removeItem(line.lineId)"
                >
                  移除商品
                </button>
              </div>
            </li>
          </ul>
        </section>

        <aside class="cart-summary" aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title">訂單摘要</h2>
          <dl>
            <div>
              <dt>商品小計</dt>
              <dd>{{ formatCurrency(cart.subtotal) }}</dd>
            </div>
          </dl>
          <p>運費 NT$0（示範訂單）</p>
          <button type="button" @click="checkout">前往結帳</button>
        </aside>
      </div>
    </div>
    <CheckoutLoginDialog ref="loginDialog" />
  </main>
</template>

<style scoped>
.cart-view {
  padding-block: clamp(2rem, 5vw, 4rem);
}
.cart-view__header {
  margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
}
.cart-view__header p {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1,
h2 {
  font-family: var(--font-display);
}
h1 {
  margin: 0.35rem 0 0;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  line-height: 1;
}
.cart-view__layout {
  display: grid;
  gap: 1.5rem;
  align-items: start;
}
.cart-view__lines {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.cart-line {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.cart-line__image {
  display: block;
  align-self: start;
  border-radius: var(--radius-sm);
}
.cart-line__image img {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-sm);
  background: var(--color-sand);
  object-fit: cover;
}
.cart-line__details {
  min-width: 0;
}
.cart-line h2 {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 1.25rem;
}
.cart-line h2 a:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.cart-line__options {
  display: flex;
  flex-wrap: wrap;
  margin: 0.5rem 0 0;
  color: var(--color-muted);
  font-size: 0.9rem;
}
.cart-line__options dt:not(:first-child) {
  margin-left: 0.75rem;
}
.cart-line__options dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}
.cart-line__unit-price {
  margin: 0.6rem 0 0.85rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}
.cart-line__total {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.cart-line__total p {
  margin: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.cart-line__total button {
  min-height: 44px;
  border: 0;
  padding: 0.5rem;
  color: var(--color-danger);
  background: transparent;
  font: inherit;
  font-weight: 700;
}
.cart-summary {
  display: grid;
  gap: 1rem;
  border-radius: var(--radius-md);
  padding: 1.5rem;
  background: var(--color-sand);
}
.cart-summary h2,
.cart-summary p {
  margin: 0;
}
.cart-summary h2 {
  font-size: 1.5rem;
}
.cart-summary dl {
  margin: 0;
  border-block: 1px solid var(--color-border);
  padding-block: 1rem;
}
.cart-summary dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.cart-summary dd {
  margin: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.cart-summary p {
  color: var(--color-muted);
  font-size: 0.9rem;
}
.cart-summary button {
  border: 0;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  padding: 0.65rem 1rem;
  color: var(--color-surface);
  background: var(--color-ink);
  font-weight: 700;
}
@media (min-width: 64rem) {
  .cart-view__layout {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem);
    gap: clamp(2rem, 5vw, 4rem);
  }
  .cart-line {
    grid-template-columns: 8rem minmax(0, 1fr) auto;
    padding-bottom: 1.5rem;
  }
  .cart-line__total {
    grid-column: auto;
    display: grid;
    align-content: space-between;
    justify-items: end;
  }
  .cart-summary {
    position: sticky;
    top: 5.5rem;
  }
}
</style>
