# Curio 前台作品集

Curio 是以 Vue 3 製作的選物商城前台，包含商品、購物車、會員結帳及訂單紀錄。

## 功能

- 首頁精選商品與分類入口。
- 商品搜尋、分類／價格篩選、排序與分頁。
- 商品詳情、規格選擇、庫存限制與加入購物車。
- 以 `localStorage` 保存購物車；登入後可送單、查詢訂單紀錄與明細。
- loading skeleton、錯誤重試、空狀態、404 頁面與繁體中文介面。
- 會員登入／登出、註冊、會員頁、登入狀態還原與會員頁導覽守衛。
- RWD 版面、鍵盤操作、可見 focus、skip link 與 reduced-motion 支援。

## 技術選擇

- Vue 3 + TypeScript + Vite
- Vue Router：路由與 view 層級 lazy loading
- Pinia：跨頁購物車狀態
- 原生 CSS tokens：Curio 的暖象牙、墨黑、米色視覺系統

## Mock 到 API 的邊界

頁面只透過 `src/services/productService.ts` 讀取商品資料，不直接依賴 mock fixture。現在 service 回傳本地示範資料；未來接入 REST API 時，替換 service 實作即可，View 與購物車流程不需要重寫。

購物車保存在瀏覽器的 `localStorage`；只有示範帳號的訂單摘要會保存在同一瀏覽器。一般會員訂單由 API 保存。

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
- 頁首右側固定放置會員入口與購物車，桌面另提供直接註冊入口；手機可直接登入。會員中心使用桌面左側導覽／右側資料區，手機將導覽移到上方，現有入口包含基本資料、購物車、商品列表及登出。

## 目前限制

目前不會線上扣款。商品仍來自靜態型錄，管理後台尚未串接這套會員訂單 API。

## 會員登入與後端接點

訪客可瀏覽和加入購物車。按「前往結帳」或「送出訂單」時若尚未登入，彈窗會引導前往登入；登入後返回結帳，購物車內容保留。

### 本地體驗

無論是否設定 `VITE_API_BASE_URL`，只有以下公開帳號會使用示範登入及本機訂單：

- Email：`demo@curio.test`
- 密碼：`Curio123!`

示範登入以 `sessionStorage` 保存八小時狀態，不保存密碼。示範訂單最多保留最近 100 筆商品及金額摘要，不保存收件人、Email、電話或地址，也不會上傳至後端。

註冊頁可由登入頁的「建立會員帳號」進入，包含會員名稱、Email、密碼及確認密碼。密碼需為 8～128 個字元，並包含大小寫英文字母與數字。前台先驗證欄位，後端仍會再次驗證；重複 Email 與後端驗證錯誤會顯示在對應欄位。

註冊與其他帳號登入皆使用 API；服務不可用時顯示提示，不會改走示範。註冊成功後需另行登入。

### 程式分工與註解

- `src/views/LoginView.vue`：輸入、欄位提示、顯示密碼與成功後導向。
- `src/views/RegisterView.vue`：註冊表單、前後端欄位錯誤與成功後的登入入口。
- `src/views/AccountView.vue`：會員資料與登出。
- `src/stores/auth.ts`：共用會員狀態與登入／登出操作。
- `src/services/authService.ts`：唯一帳號資料接點，包含示範與 API 模式。
- `src/services/orderService.ts`：送出、查詢訂單並檢查回傳資料格式；只有示範帳號使用本機資料。
- `src/utils/auth.ts`：欄位驗證與安全的站內返回網址。
- `src/styles/auth.css`：登入／註冊共用的表單樣式，避免兩頁外觀各自修改。
- `src/router/authGuard.ts`：首次還原工作階段、會員頁保護與已登入訪客的導向。

公開頁的會員還原在背景執行，不會卡住訪客購物；會員與登入頁則先確認工作階段。API 請求超過 15 秒會中止並提示重試。store 也會忽略登入／登出後才回來的舊會員查詢，避免舊資料覆寫新狀態。

### 串接 ShoppingCart.Api

複製 `.env.example` 為 `.env.local` 並設定網址，再重新啟動開發伺服器或重新建置：

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

未填時會使用同源 `/api`，因此前台可先上線。API 未部署、連線逾時或回傳 HTML 時，訂單紀錄／明細顯示空狀態，未確認的送單會保留購物車與重試識別碼。設定 API 網址後需要重新建置前台。`VITE_` 變數會公開在前端，不能放入伺服器密鑰。若部署至靜態主機，請為 Vue Router 的深連結設定回退到 `index.html`。

目前約定的端點（可依實際後端調整 `authService.ts`）：

| 方法 | 路徑                 | 請求與回應                                                                                                                       |
| ---- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| POST | `/api/auth/register` | JSON `{ "name": "...", "email": "...", "password": "...", "confirmPassword": "..." }`；成功回傳 201＋會員資料，不設定登入 Cookie |
| POST | `/api/auth/login`    | JSON `{ "email": "...", "password": "..." }`；成功回傳會員並設定登入 Cookie                                                      |
| GET  | `/api/auth/me`       | 成功回傳目前會員；未登入或工作階段過期回傳 401                                                                                   |
| POST | `/api/auth/logout`   | 清除登入 Cookie，成功回傳 200 或 204；401 亦視為已登出                                                                           |

登入與目前會員回應都使用以下格式，欄位為字串：

```json
{ "id": "member-id", "name": "會員名稱", "email": "member@example.com" }
```

前台使用 `credentials: "include"`，POST 請求集中加上 `X-Requested-With: XMLHttpRequest`；`ShoppingCart.Api` 使用自訂標頭與精確 CORS／Origin 檢查防止跨站表單操作。正式驗證由 ASP.NET Core Identity／Cookie 工作階段處理，Cookie 設定為 HttpOnly，正式環境使用 HTTPS。跨來源時，後端 CORS 必須列出確切前台來源並允許 credentials，不能使用萬用來源。跨站部署也要配合 Cookie 的 SameSite／Secure 與瀏覽器第三方 Cookie 限制；優先考慮同站網域或反向代理。

會員中心的「訂單紀錄」位於 `/account/orders`。後端提供 `POST /api/orders`、`GET /api/orders?page=1`、`GET /api/orders/{orderNumber}`，依 Cookie 的會員身分隔離資料，並以後端型錄核價。前端送出失敗時不會新增假訂單。完整契約及既有資料庫升級說明見 `ShoppingCart.Api/README.md`。
