# Curio 前台作品集

Curio 是以 Vue 3 製作的多品類策展型商城前台範例，展示從商品探索、規格選擇、購物車到模擬結帳與訂單摘要的完整流程。

## 功能

- 首頁精選商品與分類入口。
- 商品搜尋、分類／價格篩選、排序與分頁。
- 商品詳情、規格選擇、庫存限制與加入購物車。
- 以 `localStorage` 保存的購物車，以及模擬結帳與訂單摘要。
- loading skeleton、錯誤重試、空狀態、404 頁面與繁體中文介面。
- RWD 版面、鍵盤操作、可見 focus、skip link 與 reduced-motion 支援。

## 技術選擇

- Vue 3 + TypeScript + Vite
- Vue Router：路由與 view 層級 lazy loading
- Pinia：跨頁購物車狀態
- 原生 CSS tokens：Curio 的暖象牙、墨黑、米色視覺系統

## Mock 到 API 的邊界

頁面只透過 `src/services/productService.ts` 讀取商品資料，不直接依賴 mock fixture。現在 service 回傳本地示範資料；未來接入 REST API 時，替換 service 實作即可，View 與購物車流程不需要重寫。

購物車保存在此專案瀏覽器的 `localStorage`，已送出的模擬訂單摘要保存在 `sessionStorage`。

## 安裝與啟動

```bash
npm install
npm run dev
```

建立 production bundle：

```bash
npm run build
```

執行前台邏輯檢查（Node.js 24，使用內建測試工具，不安裝測試套件）：

```bash
npm test
```

## 前台程式與樣式分工

- `src/views`：各頁面的資料載入、操作流程與版面。
- `src/components`：跨頁或跨版面使用的元件。`CatalogFilters.vue` 處理桌面側欄與手機對話框，`CatalogFilterFields.vue` 共用搜尋、分類、價格及排序欄位。
- `src/utils`：商品篩選、金額格式化與結帳驗證；`src/stores/cart.ts` 保存跨頁購物車狀態。
- 元件專用樣式放在各自的 `<style scoped>`；`src/styles/base.css` 只保留基礎樣式、共用容器、焦點與無障礙設定，`tokens.css` 保存共用設計變數。

## 目前限制

這是前台 mock 作品集，不含登入、真實付款、資料庫或 API server。`shopping-cart` 與 `shopping-cart-backend` 目前各自使用不同的 mock data 與瀏覽器儲存空間，因此後台的商品或訂單修改不會同步到前台；兩者改接同一套 API 後才會支援同步。
