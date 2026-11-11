<!-- 驗證收件資料，收到訂單確認後才清空購物車。 -->
<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import CheckoutLoginDialog from "../components/CheckoutLoginDialog.vue";
import { isDemoUser } from "../services/authService";
import { orderService, OrderSubmissionError } from "../services/orderService";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";
import {
  type CheckoutDetails,
  type CheckoutErrors,
  type PaymentMethod,
  validateCheckout,
} from "../utils/checkout";
import { formatCurrency } from "../utils/format";

const cart = useCartStore();
const auth = useAuthStore();
const router = useRouter();
const loginDialog = ref<InstanceType<typeof CheckoutLoginDialog> | null>(null);
const details = reactive<CheckoutDetails>({
  name: "",
  email: "",
  phone: "",
  address: "",
  payment: "",
});
const errors = ref<CheckoutErrors>({});
const submitError = ref("");
const submitting = ref(false);
const confirmedOrder = ref("");
const attemptKey = "curio-checkout-attempt";
let attempt: { cartKey: string; id: string } | undefined;

onMounted(() => {
  if (!cart.items.length) void router.replace("/cart");
});

// 等待確認期間留在結帳頁，避免切到購物車修改正在送出的商品。
onBeforeRouteLeave(() => !submitting.value || !!confirmedOrder.value);

function cartKey(memberId: string) {
  return JSON.stringify([
    memberId,
    cart.items.map((line) => [line.lineId, line.quantity, line.unitPrice]),
  ]);
}

function getRequestId(key: string) {
  // 逾時不代表伺服器沒存到：同一會員、同一購物車重試時沿用 ID，不保存配送個資。
  if (attempt?.cartKey === key) return attempt.id;
  try {
    const stored = JSON.parse(sessionStorage.getItem(attemptKey) ?? "null");
    if (
      stored?.cartKey === key &&
      typeof stored.id === "string" &&
      /^[a-f0-9-]{36}$/i.test(stored.id)
    ) {
      attempt = { cartKey: key, id: stored.id };
      return attempt.id;
    }
  } catch {
    /* 儲存不可用時，這一頁仍會重用記憶體中的 ID。 */
  }
  attempt = { cartKey: key, id: crypto.randomUUID() };
  try {
    sessionStorage.setItem(attemptKey, JSON.stringify(attempt));
  } catch {
    /* 同上。 */
  }
  return attempt.id;
}

async function submit() {
  if (submitting.value || confirmedOrder.value) return;
  submitError.value = "";
  const member = auth.user;
  if (!member) {
    loginDialog.value?.show();
    return;
  }
  if (!cart.items.length) {
    void router.replace("/cart");
    return;
  }
  errors.value = validateCheckout(details);
  const firstInvalid = Object.keys(errors.value)[0];
  if (firstInvalid) {
    await nextTick();
    document.getElementById(firstInvalid)?.focus();
    return;
  }

  submitting.value = true;
  const key = cartKey(member.id);
  try {
    const order = await orderService.submit(
      member,
      cart.items,
      {
        ...details,
        payment: details.payment as PaymentMethod,
      },
      getRequestId(key),
    );
    // 只清除已確認的購物車。若請求期間商品或身分變更，保留新的內容。
    if (auth.user?.id !== member.id) return;
    confirmedOrder.value = order.orderNumber;
    if (cartKey(member.id) === key && cart.clearCart()) {
      try {
        sessionStorage.removeItem(attemptKey);
      } catch {
        /* 訂單已建立，不因此重送。 */
      }
    }
    if (router.currentRoute.value.name === "checkout") {
      await router.replace({
        name: "order-success",
        params: { orderNumber: order.orderNumber },
        query: { placed: "1" },
      });
    }
  } catch (error) {
    if (confirmedOrder.value) return; // 導覽失敗時仍可開啟已確認的訂單。
    if (error instanceof OrderSubmissionError && error.status === 401) {
      auth.revision++;
      auth.user = null;
      loginDialog.value?.show();
      return;
    }
    submitError.value =
      error instanceof OrderSubmissionError
        ? error.message
        : "目前無法確認訂單是否送出，購物車已保留，請稍後重試。";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="checkout-view">
    <div class="container">
      <header class="checkout-view__header">
        <h1>填寫收件資料</h1>
        <p>
          {{
            isDemoUser(auth.user)
              ? "示範結帳，不會產生實際交易。"
              : "結帳 · 目前不會線上扣款"
          }}
        </p>
      </header>

      <div class="checkout-view__layout">
        <form class="checkout-form" novalidate @submit.prevent="submit">
          <section aria-labelledby="contact-title">
            <h2 id="contact-title">聯絡與配送資訊</h2>
            <div class="checkout-form__fields">
              <div class="field">
                <label for="name">收件人姓名</label>
                <input
                  id="name"
                  v-model="details.name"
                  name="name"
                  type="text"
                  maxlength="50"
                  autocomplete="name"
                  :aria-describedby="errors.name ? 'name-error' : undefined"
                  :aria-invalid="Boolean(errors.name)"
                />
                <p v-if="errors.name" id="name-error" class="field__error">
                  {{ errors.name }}
                </p>
              </div>
              <div class="field">
                <label for="email">電子郵件</label>
                <input
                  id="email"
                  v-model="details.email"
                  name="email"
                  type="email"
                  maxlength="254"
                  autocomplete="email"
                  :aria-describedby="errors.email ? 'email-error' : undefined"
                  :aria-invalid="Boolean(errors.email)"
                />
                <p v-if="errors.email" id="email-error" class="field__error">
                  {{ errors.email }}
                </p>
              </div>
              <div class="field">
                <label for="phone">聯絡電話</label>
                <input
                  id="phone"
                  v-model="details.phone"
                  name="phone"
                  type="tel"
                  maxlength="32"
                  autocomplete="tel"
                  :aria-describedby="errors.phone ? 'phone-error' : undefined"
                  :aria-invalid="Boolean(errors.phone)"
                />
                <p v-if="errors.phone" id="phone-error" class="field__error">
                  {{ errors.phone }}
                </p>
              </div>
              <div class="field field--full">
                <label for="address">配送地址</label>
                <textarea
                  id="address"
                  v-model="details.address"
                  name="address"
                  maxlength="250"
                  rows="3"
                  autocomplete="street-address"
                  :aria-describedby="
                    errors.address ? 'address-error' : undefined
                  "
                  :aria-invalid="Boolean(errors.address)"
                />
                <p
                  v-if="errors.address"
                  id="address-error"
                  class="field__error"
                >
                  {{ errors.address }}
                </p>
              </div>
            </div>
          </section>

          <fieldset
            id="payment"
            class="payment"
            tabindex="-1"
            :aria-describedby="errors.payment ? 'payment-error' : undefined"
            :aria-invalid="Boolean(errors.payment)"
          >
            <legend>付款方式</legend>
            <label class="payment__option" for="payment-cod">
              <input
                id="payment-cod"
                v-model="details.payment"
                type="radio"
                name="payment"
                value="cod"
              />
              貨到付款
            </label>
            <label class="payment__option" for="payment-online">
              <input
                id="payment-online"
                v-model="details.payment"
                type="radio"
                name="payment"
                value="online"
              />
              模擬線上付款
            </label>
            <p
              v-if="errors.payment"
              id="payment-error"
              class="field__error"
              role="alert"
            >
              {{ errors.payment }}
            </p>
          </fieldset>

          <p v-if="submitError" class="checkout-form__alert" role="alert">
            {{ submitError }}
          </p>
          <RouterLink v-if="submitError" to="/account/orders"
            >查看訂單紀錄 →</RouterLink
          >
          <RouterLink
            v-if="confirmedOrder"
            :to="{
              name: 'order-success',
              params: { orderNumber: confirmedOrder },
            }"
          >
            訂單已建立，查看明細
          </RouterLink>
          <button v-else type="submit" :disabled="submitting">
            {{ submitting ? "建立訂單中…" : "送出訂單" }}
          </button>
        </form>

        <aside
          class="checkout-summary"
          aria-labelledby="checkout-summary-title"
        >
          <h2 id="checkout-summary-title">訂單摘要</h2>
          <ul>
            <li v-for="line in cart.items" :key="line.lineId">
              <span>{{ line.name }} × {{ line.quantity }}</span>
              <strong>
                {{ formatCurrency(line.unitPrice * line.quantity) }}
              </strong>
            </li>
          </ul>
          <dl>
            <div>
              <dt>商品小計</dt>
              <dd>{{ formatCurrency(cart.subtotal) }}</dd>
            </div>
          </dl>
          <p>本頁不蒐集或儲存任何信用卡資料。</p>
        </aside>
      </div>
    </div>
    <CheckoutLoginDialog ref="loginDialog" />
  </main>
</template>

<style scoped>
.checkout-view {
  padding-block: clamp(2rem, 5vw, 4rem);
}
.checkout-view__header {
  margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
}
.checkout-view__header p {
  margin: 0.75rem 0 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}
h1,
h2,
legend {
  font-family: var(--font-display);
}
h1 {
  margin: 0.35rem 0 0;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  line-height: 1;
}
.checkout-view__layout {
  display: grid;
  gap: 1.5rem;
  align-items: start;
}
.checkout-form,
.checkout-summary {
  border-radius: var(--radius-md);
  padding: clamp(1.25rem, 4vw, 2rem);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}
.checkout-form {
  display: grid;
  gap: 1.75rem;
}
.checkout-form h2,
.checkout-summary h2 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
}
.checkout-form__fields {
  display: grid;
  gap: 1rem;
}
.field {
  display: grid;
  gap: 0.4rem;
}
.field label,
legend {
  font-weight: 700;
}
.field input,
.field textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--color-field-border);
  border-radius: var(--radius-sm);
  padding: 0.65rem 0.75rem;
  color: var(--color-ink);
  background: var(--color-surface);
}
.field textarea {
  min-height: 7rem;
  resize: vertical;
}
.field__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 700;
}
.checkout-form__alert {
  margin: 0;
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 10%, var(--color-surface));
  font-weight: 700;
}
.payment {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  border: 0;
  padding: 0;
}
.payment legend {
  margin-bottom: 0.25rem;
  padding: 0;
  font-size: 1.25rem;
}
.payment__option {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.65rem 0.75rem;
}
.payment__option input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--color-ink);
}
button[type="submit"] {
  min-height: 44px;
  border: 0;
  border-radius: var(--radius-sm);
  padding: 0.7rem 1rem;
  color: var(--color-surface);
  background: var(--color-ink);
  font-weight: 700;
}
.checkout-summary {
  display: grid;
  gap: 1rem;
  background: var(--color-sand);
}
.checkout-summary h2,
.checkout-summary p {
  margin: 0;
}
.checkout-summary ul {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.checkout-summary li,
.checkout-summary dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.checkout-summary li span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.checkout-summary strong,
.checkout-summary dd {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.checkout-summary dl {
  margin: 0;
  border-block: 1px solid var(--color-border);
  padding-block: 1rem;
}
.checkout-summary dd {
  margin: 0;
  font-weight: 700;
}
.checkout-summary p {
  color: var(--color-muted);
  font-size: 0.9rem;
}
@media (min-width: 48rem) {
  .checkout-form__fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .field--full {
    grid-column: 1 / -1;
  }
}
@media (min-width: 64rem) {
  .checkout-view__layout {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem);
    gap: clamp(2rem, 5vw, 4rem);
  }
  .checkout-summary {
    position: sticky;
    top: 5.5rem;
  }
}
</style>
