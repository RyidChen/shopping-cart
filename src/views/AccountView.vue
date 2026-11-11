<!-- 會員中心：左側導覽與右側資料區；僅呈現 API 已確認的會員資料。 -->
<script setup lang="ts">
import {
  ArrowRight,
  ChevronRight,
  Info,
  LogOut,
  Package,
  ShoppingCart,
  UserRound,
} from "@lucide/vue";
import { computed, ref } from "vue";
import { isNavigationFailure, useRouter } from "vue-router";
import BaseButton from "../components/BaseButton.vue";
import { isDemoUser } from "../services/authService";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const isDemoAuth = computed(() => isDemoUser(auth.user));
const router = useRouter();
const navigationError = ref("");

async function logout() {
  navigationError.value = "";
  if (!(await auth.logout())) return;
  try {
    const result = await router.replace("/login");
    if (isNavigationFailure(result)) throw result;
  } catch {
    navigationError.value = "已登出，請從上方導覽繼續瀏覽。";
  }
}
</script>

<template>
  <main class="account-view container">
    <nav class="account-breadcrumb" aria-label="所在位置">
      <RouterLink to="/">首頁</RouterLink>
      <ChevronRight :size="14" aria-hidden="true" />
      <span aria-current="page">會員中心</span>
    </nav>
    <header class="account-heading">
      <h1>會員中心</h1>
      <p>查看你的帳戶資訊，繼續探索喜歡的日常。</p>
    </header>

    <p v-if="auth.error || navigationError" class="account-error" role="alert">
      {{ auth.error || navigationError }}
    </p>

    <div v-if="auth.user" class="account-layout">
      <!-- 手機將側欄改為上方導覽；所有連結只指向目前已可使用的功能。 -->
      <aside class="account-sidebar" aria-label="會員選單">
        <div class="account-identity">
          <span class="account-avatar"
            ><UserRound :size="24" aria-hidden="true"
          /></span>
          <div>
            <strong>{{ auth.user.name }}</strong>
            <span>{{ isDemoAuth ? "示範會員" : "會員帳號" }}</span>
          </div>
        </div>
        <nav class="account-navigation" aria-label="會員服務">
          <a
            class="account-navigation__active"
            href="#member-profile"
            aria-current="location"
          >
            <UserRound :size="18" aria-hidden="true" />
            基本資料
            <ChevronRight
              class="account-navigation__arrow"
              :size="16"
              aria-hidden="true"
            />
          </a>
          <RouterLink to="/account/orders">
            <Package :size="18" aria-hidden="true" />訂單紀錄
          </RouterLink>
          <RouterLink to="/cart">
            <ShoppingCart :size="18" aria-hidden="true" />我的購物車
          </RouterLink>
        </nav>
        <div class="account-signout">
          <BaseButton variant="text" :loading="auth.busy" @click="logout">
            <LogOut v-if="!auth.busy" :size="17" aria-hidden="true" />
            {{ auth.busy ? "登出中…" : "登出帳號" }}
          </BaseButton>
        </div>
      </aside>

      <div class="account-content">
        <section class="account-welcome" aria-labelledby="account-title">
          <div>
            <h2 id="account-title">你好，{{ auth.user.name }}</h2>
            <p>在這裡查看會員資料，或前往訂單紀錄。</p>
          </div>
          <RouterLink class="account-shop" to="/products">
            探索精選商品 <ArrowRight :size="17" aria-hidden="true" />
          </RouterLink>
        </section>

        <section
          id="member-profile"
          class="account-profile"
          aria-labelledby="profile-title"
        >
          <header class="account-profile__heading">
            <div>
              <h2 id="profile-title">基本資料</h2>
              <p>你的會員帳號與聯絡資訊</p>
            </div>
            <span class="account-status">已登入</span>
          </header>
          <dl class="account-details">
            <div>
              <dt>會員名稱</dt>
              <dd>{{ auth.user.name }}</dd>
            </div>
            <div>
              <dt>電子郵件</dt>
              <dd>{{ auth.user.email }}</dd>
            </div>
          </dl>
          <div v-if="isDemoAuth" class="account-note">
            <Info :size="17" aria-hidden="true" />
            <p>目前使用示範帳號，登入狀態最長保留 8 小時。</p>
          </div>
        </section>
      </div>
    </div>

    <section v-else class="account-profile account-signed-out">
      <h2>你已登出</h2>
      <p>登入後即可查看會員資料。</p>
      <RouterLink class="account-shop" to="/login">重新登入</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.account-view {
  padding-block: 1.5rem clamp(2.5rem, 6vw, 5rem);
}
.account-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-muted);
  font-size: 0.8rem;
}
.account-breadcrumb a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
}
.account-breadcrumb a:hover {
  color: var(--color-ink);
}
.account-heading {
  margin-block: 1rem 1.75rem;
}
.account-heading p {
  margin: 0.65rem 0 0;
  color: var(--color-muted);
  font-size: 0.9rem;
}
h1,
h2 {
  margin: 0;
  font-family: var(--font-display);
}
h1 {
  font-size: clamp(1.85rem, 4vw, 2.5rem);
}
h2 {
  font-size: 1.35rem;
  overflow-wrap: anywhere;
}
.account-layout {
  display: grid;
  align-items: start;
  gap: 1.5rem;
}
.account-sidebar,
.account-profile {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.account-identity {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.25rem;
}
.account-identity > div {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}
.account-identity strong {
  overflow-wrap: anywhere;
}
.account-identity > div > span {
  color: var(--color-muted);
  font-size: 0.8rem;
}
.account-avatar {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: var(--color-sand);
}
.account-navigation {
  display: grid;
  gap: 0.25rem;
  border-top: 1px solid var(--color-border);
  padding: 0.75rem;
}
.account-navigation a {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 0.75rem;
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  font-size: 0.9rem;
}
.account-navigation a:hover {
  background: var(--color-bg);
}
.account-navigation .account-navigation__active {
  background: var(--color-sand);
  font-weight: 700;
}
.account-navigation__arrow {
  margin-left: auto;
}
.account-signout {
  border-top: 1px solid var(--color-border);
  padding: 0.75rem 1.5rem;
}
.account-signout :deep(button) {
  color: var(--color-muted);
  font-size: 0.875rem;
}
.account-content {
  display: grid;
  gap: 1.5rem;
  min-width: 0;
}
.account-welcome {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: clamp(1.25rem, 3vw, 2rem);
  background: var(--color-sand);
}
.account-welcome h2 + p {
  margin: 0.65rem 0 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}
.account-profile {
  scroll-margin-top: 6rem;
  padding: clamp(1.25rem, 3vw, 2rem);
}
.account-profile__heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}
.account-profile__heading p {
  margin: 0.5rem 0 0;
  color: var(--color-muted);
  font-size: 0.85rem;
}
.account-status {
  flex-shrink: 0;
  border-radius: 100vmax;
  padding: 0.25rem 0.65rem;
  color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 8%, var(--color-surface));
  font-size: 0.75rem;
  font-weight: 600;
}
.account-details {
  margin: 1.5rem 0 0;
}
.account-details > div {
  display: grid;
  gap: 0.35rem;
  border-top: 1px solid var(--color-border);
  padding-block: 1rem;
}
dt {
  color: var(--color-muted);
  font-size: 0.875rem;
}
dd {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.account-note {
  display: flex;
  align-items: start;
  gap: 0.6rem;
  margin-top: 1rem;
  border-radius: var(--radius-sm);
  padding: 0.85rem;
  color: var(--color-muted);
  background: var(--color-bg);
  font-size: 0.8rem;
}
.account-note svg {
  flex-shrink: 0;
  margin-top: 0.1rem;
}
.account-note p {
  margin: 0;
}
.account-error {
  color: var(--color-danger);
}
.account-shop {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border-radius: var(--radius-sm);
  padding: 0.65rem 1rem;
  color: var(--color-surface);
  background: var(--color-ink);
  font-weight: 600;
}
.account-shop:hover {
  opacity: 0.78;
}
.account-signed-out p {
  color: var(--color-muted);
}
@media (min-width: 48rem) {
  .account-layout {
    grid-template-columns: 14rem minmax(0, 1fr);
    gap: 2rem;
  }
  .account-sidebar {
    position: sticky;
    top: 6rem;
  }
  .account-details > div {
    grid-template-columns: 9rem minmax(0, 1fr);
    gap: 1rem;
    align-items: baseline;
  }
}
@media (max-width: 47.999rem) {
  .account-navigation {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
  }
  .account-navigation a {
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.65rem 0.25rem;
    font-size: 0.8rem;
    text-align: center;
  }
  .account-navigation__arrow {
    display: none;
  }
  .account-signout {
    display: flex;
    justify-content: flex-end;
    padding-block: 0.3rem;
  }
}
</style>
