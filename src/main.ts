import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import { registerAuthGuard } from "./router/authGuard";
import "./styles/tokens.css";
import "./styles/base.css";

const pinia = createPinia();
// 在 Router 開始初次導覽前註冊，重整會員頁時也會先檢查登入狀態。
registerAuthGuard(router, pinia);
createApp(App).use(pinia).use(router).mount("#app");
