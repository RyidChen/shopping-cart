<!-- 送單完成與歷史明細共用同一頁；只顯示會員能查到的訂單。 -->
<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { isDemoUser } from "../services/authService";
import { orderService, type OrderRecord } from "../services/orderService";
import { useAuthStore } from "../stores/auth";
import { formatCurrency, formatOrderDate } from "../utils/format";

const route = useRoute();
const auth = useAuthStore();
const order = ref<OrderRecord | null>(null);
const loading = ref(false);
watch(
  [() => auth.user?.id, () => route.params.orderNumber],
  async ([, number], _, onCleanup) => {
    let current = true;
    onCleanup(() => {
      current = false;
    });
    order.value = null;
    loading.value = !!auth.user;
    const result =
      typeof number === "string"
        ? await orderService.get(auth.user, number)
        : null;
    if (current) {
      order.value = result;
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="order-success">
    <div class="container">
      <p v-if="loading" role="status">讀取訂單中…</p>
      <section
        v-else-if="!order"
        class="order-success__safe-state"
        role="status"
        aria-live="polite"
      >
        <p>訂單明細</p>
        <h1>無法取得訂單摘要</h1>
        <p>目前查不到這張訂單，請確認已登入原下單帳號，或稍後再試。</p>
        <RouterLink to="/account/orders">返回訂單紀錄</RouterLink>
      </section>

      <section
        v-else
        class="order-success__summary"
        aria-labelledby="order-success-title"
      >
        <p>{{ route.query.placed === "1" ? "訂單已送出" : "訂單明細" }}</p>
        <h1 id="order-success-title">
          {{ route.query.placed === "1" ? "謝謝您的選購" : "購買明細" }}
        </h1>
        <p>
          {{ isDemoUser(auth.user) ? "示範訂單編號：" : "訂單編號：" }}
          <strong>{{ order.orderNumber }}</strong>
        </p>
        <p>
          {{ formatOrderDate(order.createdAt) }} ·
          {{ order.payment === "cod" ? "貨到付款" : "模擬線上付款（未扣款）" }}
        </p>
        <div class="order-success__details">
          <section aria-labelledby="order-lines-title">
            <h2 id="order-lines-title">本次購買項目</h2>
            <ul>
              <li v-for="(line, index) in order.items" :key="index">
                <span>
                  <strong>{{ line.name }}</strong>
                  <small v-if="Object.keys(line.selectedOptions).length">
                    {{
                      Object.entries(line.selectedOptions)
                        .map(([name, value]) => `${name}：${value}`)
                        .join("、")
                    }}
                  </small>
                </span>
                <span>
                  {{ line.quantity }} 件 ·
                  {{ formatCurrency(line.unitPrice * line.quantity) }}
                </span>
              </li>
            </ul>
          </section>
          <aside aria-label="訂單金額">
            <span>商品小計</span>
            <strong>{{ formatCurrency(order.subtotal) }}</strong>
          </aside>
        </div>
        <nav aria-label="下一步">
          <RouterLink to="/account/orders">查看訂單紀錄</RouterLink>
          <RouterLink to="/products">繼續購物</RouterLink>
        </nav>
      </section>
    </div>
  </main>
</template>

<style scoped>
.order-success {
  padding-block: clamp(3rem, 8vw, 6rem);
}
.order-success__summary,
.order-success__safe-state {
  max-width: 48rem;
  margin-inline: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: clamp(1.5rem, 5vw, 3rem);
  background: var(--color-surface);
}
.order-success__summary > p:first-child,
.order-success__safe-state > p:first-child {
  margin: 0;
  color: var(--color-success);
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
  margin: 0.35rem 0 1rem;
  font-size: clamp(1.75rem, 5vw, 3rem);
  line-height: 1.3;
}
.order-success__summary > p:not(:first-child),
.order-success__safe-state > p:not(:first-child) {
  margin: 0;
  color: var(--color-muted);
  overflow-wrap: anywhere;
}
.order-success__details {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}
.order-success__details section,
.order-success__details aside {
  border-radius: var(--radius-md);
  padding: 1.25rem;
  background: var(--color-sand);
}
.order-success__details h2 {
  margin: 0 0 1rem;
  font-size: 1.4rem;
}
.order-success__details ul {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.order-success__details li {
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  gap: 0.35rem 1rem;
}
.order-success__details li > span:first-child {
  flex: 1 1 10rem;
  overflow-wrap: anywhere;
}
.order-success__details li > span {
  display: grid;
  gap: 0.2rem;
}
.order-success__details li > span:last-child,
.order-success__details aside strong {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
small {
  color: var(--color-muted);
}
.order-success__details aside {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}
nav a,
.order-success__safe-state a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-sm);
  padding: 0.65rem 1rem;
  font-weight: 700;
}
nav a:first-child,
.order-success__safe-state a {
  color: var(--color-surface);
  background: var(--color-ink);
}
.order-success__safe-state a {
  margin-top: 1.5rem;
}
@media (min-width: 48rem) {
  .order-success__details {
    grid-template-columns: minmax(0, 1fr) minmax(12rem, 0.55fr);
  }
}
</style>
