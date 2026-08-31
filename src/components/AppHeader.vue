<script setup lang="ts">
import { Menu, ShoppingCart, X } from "@lucide/vue";
import { ref } from "vue";
import { useCartStore } from "../stores/cart";

const menuOpen = ref(false);
const cart = useCartStore();
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
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
      <nav
        id="site-navigation"
        class="site-header__nav"
        :class="{ 'site-header__nav--open': menuOpen }"
        aria-label="主要導覽"
      >
        <RouterLink to="/" @click="menuOpen = false">首頁</RouterLink>
        <RouterLink to="/products" @click="menuOpen = false"
          >商品列表</RouterLink
        >
      </nav>
      <RouterLink
        class="site-header__cart"
        to="/cart"
        :aria-label="`購物車，目前 ${cart.itemCount} 件商品`"
      >
        <ShoppingCart aria-hidden="true" :size="19" :stroke-width="1.9" />
        <span>購物車</span>
        <span class="site-header__count" aria-hidden="true">{{
          cart.itemCount
        }}</span>
      </RouterLink>
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
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 0.75rem;
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
  height: 2.5rem;
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
    grid-template-columns: 1fr auto 1fr;
  }
  .site-header__menu {
    display: none;
  }
  .site-header__nav {
    display: flex;
    gap: 0.25rem;
  }
  .site-header__brand-logo {
    height: 2.75rem;
  }
  .site-header__cart {
    justify-self: end;
  }
}
</style>
