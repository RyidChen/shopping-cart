<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from "vue";
import { isNavigationFailure, useRouter } from "vue-router";
import { useCartStore } from "../stores/cart";
import {
  createOrderNumber,
  type CheckoutDetails,
  type CheckoutErrors,
  type OrderSnapshot,
  type PaymentMethod,
  validateCheckout,
} from "../utils/checkout";
import { formatCurrency } from "../utils/format";

const cart = useCartStore();
const router = useRouter();
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

onMounted(() => {
  if (!cart.items.length) router.replace("/cart");
});

const submit = async () => {
  if (submitting.value) return;
  submitError.value = "";
  if (!cart.items.length) {
    router.replace("/cart");
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

  const cartSnapshot = cart.items.map((item) => ({
    ...item,
    selectedOptions: { ...item.selectedOptions },
  }));
  let previousOrder: string | null = null;
  let orderStored = false;
  let cartCleared = false;
  try {
    const order: OrderSnapshot = {
      orderNumber: createOrderNumber(),
      items: cartSnapshot.map((item) => ({
        lineId: item.lineId,
        name: item.name,
        image: item.image,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        inventory: item.inventory,
        selectedOptions: { ...item.selectedOptions },
      })),
      subtotal: cart.subtotal,
      details: { ...details, payment: details.payment as PaymentMethod },
    };
    previousOrder = sessionStorage.getItem("curio-last-order");
    sessionStorage.setItem("curio-last-order", JSON.stringify(order));
    orderStored = true;
    if (!cart.clearCart()) throw new Error("Unable to persist cart clear");
    cartCleared = true;
    const navigation = await router.push({
      name: "order-success",
      params: { orderNumber: order.orderNumber },
    });
    if (isNavigationFailure(navigation)) throw navigation;
  } catch {
    if (cartCleared) cart.restoreCart(cartSnapshot);
    if (orderStored) {
      try {
        if (previousOrder === null)
          sessionStorage.removeItem("curio-last-order");
        else sessionStorage.setItem("curio-last-order", previousOrder);
      } catch {
        // Best effort only when browser storage is unavailable.
      }
    }
    submitError.value = "無法建立訂單，請稍後再試。";
    if (router.currentRoute.value.path !== "/checkout") {
      try {
        await router.replace("/checkout");
      } catch {
        // The visible error remains when checkout is still mounted.
      }
    }
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <main class="checkout-view">
    <div class="container">
      <header class="checkout-view__header">
        <p>安全的模擬結帳(目前僅做頁面展示，未做實際交易)</p>
        <h1>完成訂單</h1>
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
            <label class="payment__option" for="payment-cod"
              ><input
                id="payment-cod"
                v-model="details.payment"
                type="radio"
                name="payment"
                value="cod"
              />貨到付款</label
            >
            <label class="payment__option" for="payment-online"
              ><input
                id="payment-online"
                v-model="details.payment"
                type="radio"
                name="payment"
                value="online"
              />模擬線上付款</label
            >
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
          <button type="submit" :disabled="submitting">
            {{ submitting ? "建立訂單中…" : "送出模擬訂單" }}
          </button>
        </form>

        <aside
          class="checkout-summary"
          aria-labelledby="checkout-summary-title"
        >
          <h2 id="checkout-summary-title">訂單摘要</h2>
          <ul>
            <li v-for="line in cart.items" :key="line.lineId">
              <span>{{ line.name }} × {{ line.quantity }}</span
              ><strong>{{
                formatCurrency(line.unitPrice * line.quantity)
              }}</strong>
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
  margin: 0;
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
  border: 1px solid var(--color-border);
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
    top: 1.5rem;
  }
}
</style>
