<!-- Logo、桌面／手機導覽、即時購物車數量 -->
<script setup lang="ts">
import { Menu, ShoppingCart, UserRound, X } from "@lucide/vue";
import { ref } from "vue";
import { useCartStore } from "../stores/cart";
import { useAuthStore } from "../stores/auth";

const menuOpen = ref(false);
const cart = useCartStore();
const auth = useAuthStore();
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <button
        class="site-header__menu"
        type="button"
        :aria-label="menuOpen ? '關閉選單' : '開啟選單'"
        :aria-expanded="menuOpen"
        aria-controls="site-navigation"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" aria-hidden="true" :size="22" />
        <Menu v-else aria-hidden="true" :size="22" />
      </button>
      <RouterLink
        class="site-header__brand"
        to="/"
        aria-label="Curio 購物網站首頁"
        @click="menuOpen = false"
      >
        <img
          class="site-header__brand-logo"
          src="/curio-logo.png"
          alt=""
          width="404"
          height="156"
        />
      </RouterLink>
      <!-- 手機版由選單按鈕控制展開；桌面版會透過媒體查詢固定顯示。 -->
      <nav
        id="site-navigation"
        class="site-header__nav"
        :class="{ 'site-header__nav--open': menuOpen }"
        aria-label="主要導覽"
      >
        <RouterLink to="/" @click="menuOpen = false">首頁</RouterLink>
        <RouterLink to="/products" @click="menuOpen = false">
          商品列表
        </RouterLink>
      </nav>
      <!-- 會員與購物車固定在右側；手機也能直接登入，不必先展開導覽選單。 -->
      <div class="site-header__actions">
        <div class="site-header__member-links">
          <RouterLink
            class="site-header__member"
            :to="auth.isAuthenticated ? '/account' : '/login'"
            :aria-label="auth.isAuthenticated ? '會員中心' : '登入'"
            @click="menuOpen = false"
          >
            <UserRound aria-hidden="true" :size="20" />
            <span class="site-header__member-mobile" aria-hidden="true">
              {{ auth.isAuthenticated ? "會員" : "登入" }}
            </span>
            <span class="site-header__member-desktop" aria-hidden="true">
              {{ auth.isAuthenticated ? "會員中心" : "登入" }}
            </span>
          </RouterLink>
          <template v-if="!auth.isAuthenticated">
            <span class="site-header__separator" aria-hidden="true">/</span>
            <RouterLink
              class="site-header__register"
              to="/register"
              @click="menuOpen = false"
            >
              註冊
            </RouterLink>
          </template>
        </div>
        <!-- aria-label 帶入即時件數，手機隱藏文字後仍有完整可讀名稱。 -->
        <RouterLink
          class="site-header__cart"
          to="/cart"
          :aria-label="`購物車，目前 ${cart.itemCount} 件商品`"
          @click="menuOpen = false"
        >
          <ShoppingCart aria-hidden="true" :size="20" :stroke-width="1.9" />
          <span class="site-header__cart-label">購物車</span>
          <span class="site-header__count" aria-hidden="true">{{
            cart.itemCount
          }}</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid rgb(222 217 207 / 80%);
  background: rgb(247 245 240 / 92%);
  backdrop-filter: blur(12px);
}
.site-header__inner {
  min-height: 4.25rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
}
.site-header__brand {
  width: max-content;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-sm);
}
.site-header__brand-logo {
  width: auto;
  height: 2rem;
  display: block;
  transition: opacity var(--transition);
}
.site-header__brand:hover .site-header__brand-logo,
.site-header__brand:active .site-header__brand-logo {
  opacity: 0.72;
}
.site-header__brand:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 3px;
}
.site-header__menu {
  width: 2.75rem;
  height: 2.75rem;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--color-ink);
  background: transparent;
}
.site-header__menu:hover {
  background: var(--color-sand);
}
.site-header__nav {
  display: none;
}
.site-header__nav--open {
  position: absolute;
  top: calc(100% + 1px);
  left: 0;
  right: 0;
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem max(1rem, calc((100vw - var(--container)) / 2));
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}
.site-header__nav a {
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
}
.site-header__nav a:hover,
.site-header__nav a.router-link-exact-active {
  background: var(--color-sand);
}
.site-header__actions,
.site-header__member-links {
  display: flex;
  align-items: center;
}
.site-header__actions {
  gap: 0.75rem;
  justify-self: end;
}
.site-header__member,
.site-header__register {
  display: inline-flex;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  gap: 0.35rem;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}
.site-header__member:hover,
.site-header__register:hover {
  color: var(--color-muted);
}
.site-header__member.router-link-exact-active,
.site-header__register.router-link-exact-active {
  text-decoration: underline;
  text-underline-offset: 0.35rem;
}
.site-header__member-desktop,
.site-header__register,
.site-header__separator,
.site-header__cart-label {
  display: none;
}
.site-header__cart {
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.875rem;
  font-weight: 600;
}
.site-header__count {
  min-width: 1.35rem;
  padding: 0.1rem 0.35rem;
  border-radius: 100vmax;
  color: var(--color-surface);
  background: var(--color-ink);
  text-align: center;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
@media (min-width: 48rem) {
  .site-header__inner {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 1rem;
  }
  .site-header__menu {
    display: none;
  }
  .site-header__nav {
    position: static;
    display: flex;
    gap: 0.25rem;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
  .site-header__brand-logo {
    height: 2.75rem;
  }
  .site-header__actions {
    gap: 1.25rem;
  }
  .site-header__member-links {
    gap: 0.5rem;
  }
  .site-header__member-mobile {
    display: none;
  }
  .site-header__member-desktop,
  .site-header__cart-label {
    display: inline;
  }
  .site-header__register {
    display: inline-flex;
  }
  .site-header__separator {
    display: inline;
    color: var(--color-border);
  }
  .site-header__cart {
    border-left: 1px solid var(--color-border);
    padding-left: 1.25rem;
  }
}
</style>
