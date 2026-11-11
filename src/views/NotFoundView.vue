<!-- 404 與返回有效頁面的入口 -->
<template>
  <main class="not-found">
    <section class="not-found__content">
      <p>404</p>
      <h1>找不到這個頁面</h1>
      <span>網址可能有誤，或頁面已移除。您可以返回首頁，或繼續瀏覽商品。</span>
      <nav aria-label="404 導覽">
        <RouterLink to="/">返回首頁</RouterLink>
        <RouterLink to="/products">瀏覽商品</RouterLink>
      </nav>
    </section>
  </main>
</template>

<style scoped>
.not-found {
  display: grid;
  min-height: 32rem;
  place-items: center;
  padding: clamp(2rem, 8vw, 6rem) 1rem;
}
.not-found__content {
  width: min(100%, 42rem);
  border-radius: var(--radius-lg);
  padding: clamp(1.5rem, 6vw, 4rem);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  text-align: center;
}
p {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}
h1 {
  margin: 0.5rem 0 1rem;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 5rem);
  line-height: 1;
  letter-spacing: -0.04em;
}
span {
  display: block;
  max-width: 32rem;
  margin-inline: auto;
  color: var(--color-muted);
}
nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
}
a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-sm);
  padding: 0.65rem 1rem;
  font-weight: 700;
}
a:first-child {
  color: var(--color-surface);
  background: var(--color-ink);
}
</style>
