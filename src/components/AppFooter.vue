<!-- 品牌頁尾和動態年份 -->
<template>
  <footer class="site-footer">
    <div class="container site-footer__inner">
      <p class="site-footer__brand">Curio</p>
      <p>Curio 日常選物 · 居家、穿搭與隨身好物</p>
      <!-- 年份在渲染時動態取得，避免每年手動修改頁尾。 -->
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
  text-align: center;
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
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
    align-items: center;
    gap: 2rem;
  }
  .site-footer__brand {
    text-align: start;
  }
  small {
    margin: 0;
    text-align: end;
  }
}
</style>
