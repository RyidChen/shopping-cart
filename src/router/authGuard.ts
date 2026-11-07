import type { Pinia } from "pinia";
import type { Router } from "vue-router";
import { useAuthStore } from "../stores/auth.ts";
import { getAuthRedirect } from "../utils/auth.ts";

export function registerAuthGuard(router: Router, pinia: Pinia) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore(pinia);
    // 會員／登入頁必須確認工作階段；公開頁在背景還原，會員 API 慢速不會卡住購物。
    if (to.meta.requiresAuth || to.meta.guestOnly) {
      await auth.restoreSession();
    } else if (!auth.initialized) {
      void auth.restoreSession();
    }
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { path: "/login", query: { redirect: to.fullPath } };
    }
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return getAuthRedirect(to.query.redirect);
    }
    // 前端守衛僅管理導覽；正式 API 必須自行驗證會員身分與資料存取權限。
  });
}
