<template>
  <footer class="site-footer">
    <div class="container site-footer__inner">
      <p class="site-footer__brand">Curio</p>
      <p>為日常挑選，值得久留的物件。</p>
      <small>© {{ new Date().getFullYear() }} 陳泓孝</small>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
}
.site-footer__inner {
  min-height: 11rem;
  display: grid;
  align-content: center;
  gap: 0.5rem;
  padding-block: 2rem;
}
p {
  margin: 0;
}
.site-footer__brand {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
}
small {
  margin-top: 0.5rem;
}
@media (min-width: 48rem) {
  .site-footer__inner {
    grid-template-columns: 1fr 2fr auto;
    align-items: center;
    gap: 2rem;
  }
  small {
    margin: 0;
  }
}
</style>
