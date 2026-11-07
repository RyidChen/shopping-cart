<script setup lang="ts">
import { ref, watch } from "vue";
import BaseButton from "../components/BaseButton.vue";
import EmptyState from "../components/EmptyState.vue";
import { isDemoUser } from "../services/authService";
import { orderService, type OrderPage } from "../services/orderService";
import { useAuthStore } from "../stores/auth";
import { formatCurrency, formatOrderDate } from "../utils/format";

const auth = useAuthStore();
const page = ref(1);
const retry = ref(0);
const loading = ref(false);
const result = ref<OrderPage>({
  orders: [],
  hasMore: false,
  unavailable: false,
});

// 換帳號、翻頁或離開時，丟棄舊請求的結果，不把舊資料留在畫面。
watch(
  [() => auth.user?.id, page, retry],
  async (_, __, onCleanup) => {
    let current = true;
    onCleanup(() => {
      current = false;
    });
    result.value = { orders: [], hasMore: false, unavailable: false };
    loading.value = !!auth.user;
    const next = await orderService.list(auth.user, page.value);
    if (current) {
      result.value = next;
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="order-history container">
    <RouterLink class="back-link" :to="auth.user ? '/account' : '/'">
      {{ auth.user ? "← 返回會員中心" : "← 返回首頁" }}
    </RouterLink>
    <header>
      <h1>訂單紀錄</h1>
      <p>
        {{
          isDemoUser(auth.user)
            ? "此瀏覽器的示範訂單，不會產生交易。"
            : "查看你送出的訂單與購買明細。"
        }}
      </p>
    </header>

    <p v-if="loading" role="status">讀取訂單中…</p>
    <EmptyState
      v-else-if="!auth.user"
      title="目前沒有訂單"
      :message="
        auth.error
          ? '暫時無法確認登入狀態，請稍後再試。'
          : '登入後即可查看你的訂單紀錄。'
      "
      action-label="前往登入"
      to="/login?redirect=/account/orders"
    />
    <EmptyState
      v-else-if="!result.orders.length"
      title="目前沒有訂單"
      :message="
        result.unavailable
          ? '暫時無法載入訂單，請稍後重試。'
          : '送出訂單後，會顯示在這裡。'
      "
      :action-label="result.unavailable ? undefined : '瀏覽商品'"
      :to="result.unavailable ? undefined : '/products'"
    >
      <BaseButton v-if="result.unavailable" variant="secondary" @click="retry++"
        >重新載入</BaseButton
      >
    </EmptyState>
    <ul v-else class="order-list">
      <li v-for="order in result.orders" :key="order.orderNumber">
        <div>
          <time :datetime="order.createdAt">{{
            formatOrderDate(order.createdAt)
          }}</time>
          <h2>{{ order.orderNumber }}</h2>
          <p>
            {{
              order.items.reduce((sum, item) => sum + item.quantity, 0)
            }}
            件商品 · {{ formatCurrency(order.subtotal) }}
          </p>
        </div>
        <RouterLink
          :to="{
            name: 'order-success',
            params: { orderNumber: order.orderNumber },
          }"
          :aria-label="'查看訂單 ' + order.orderNumber"
          >查看明細 →</RouterLink
        >
      </li>
    </ul>
    <nav
      v-if="!loading && auth.user && (page > 1 || result.hasMore)"
      aria-label="訂單分頁"
    >
      <BaseButton variant="secondary" :disabled="page === 1" @click="page--"
        >上一頁</BaseButton
      >
      <span>第 {{ page }} 頁</span>
      <BaseButton
        variant="secondary"
        :disabled="!result.hasMore"
        @click="page++"
        >下一頁</BaseButton
      >
    </nav>
  </main>
</template>

<style scoped>
.order-history {
  max-width: 60rem;
  padding-block: 2rem 4rem;
}
.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}
header {
  margin: 1rem 0 1.5rem;
}
h1 {
  margin: 0;
  font: 700 clamp(1.9rem, 4vw, 2.5rem) var(--font-display);
}
p,
time {
  color: var(--color-muted);
}
.order-list {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.order-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  background: var(--color-surface);
}
.order-list li > div {
  min-width: 0;
}
.order-list h2 {
  margin: 0.4rem 0;
  font-size: 1rem;
  overflow-wrap: anywhere;
}
.order-list p {
  margin: 0;
}
.order-list a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-weight: 700;
}
nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
