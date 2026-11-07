import { defineStore } from "pinia";
import {
  authService,
  RegistrationError,
  type AuthUser,
} from "../services/authService.ts";
import type {
  LoginCredentials,
  RegistrationDetails,
  RegistrationErrors,
} from "../utils/auth.ts";

// 至少顯示 600ms 過場，避免示範登入或快速 API 回應時畫面一閃而過。
// 從請求開始計時；後端本來就較慢時，不再額外等待 600ms。
const finishLoading = (startedAt: number) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, Math.max(0, 600 - (Date.now() - startedAt))),
  );

// 集中會員狀態；只有 service 碰 API／儲存，頁面只負責表單與導覽。
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as AuthUser | null,
    initialized: false,
    busy: false,
    error: "",
    registrationErrors: {} as RegistrationErrors,
    revision: 0,
  }),
  getters: { isAuthenticated: (state) => state.user !== null },
  actions: {
    async register(details: RegistrationDetails): Promise<boolean> {
      if (this.busy) return false;
      const startedAt = Date.now();
      this.busy = true;
      this.error = "";
      this.registrationErrors = {};
      try {
        await authService.register(details);
        // 後端註冊不會建立 Cookie；不要在這裡設定 user，完成後仍需登入。
        return true;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "註冊失敗，請稍後再試。";
        if (error instanceof RegistrationError)
          this.registrationErrors = error.fields;
        return false;
      } finally {
        await finishLoading(startedAt);
        this.busy = false;
      }
    },

    async restoreSession() {
      const revision = ++this.revision;
      // 表示已啟動首次還原，公開頁面不必重複發送同一查詢。
      this.initialized = true;
      try {
        const user = await authService.getCurrentUser();
        // 登入、登出或較新的查詢已發生時，捨棄舊回應，避免把登出的會員重新登入。
        if (revision !== this.revision) return;
        this.user = user;
        this.error = "";
      } catch (error) {
        if (revision !== this.revision) return;
        this.user = null;
        this.error =
          error instanceof Error ? error.message : "無法確認登入狀態，請重試。";
      }
    },
    async login(credentials: LoginCredentials): Promise<boolean> {
      if (this.busy) return false;
      const startedAt = Date.now();
      this.revision++;
      this.busy = true;
      this.error = "";
      try {
        this.user = await authService.login(credentials);
        this.revision++;
        this.initialized = true;
        return true;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "登入失敗，請稍後再試。";
        return false;
      } finally {
        await finishLoading(startedAt);
        this.busy = false;
      }
    },
    async logout(): Promise<boolean> {
      if (this.busy) return false;
      const startedAt = Date.now();
      this.revision++;
      this.busy = true;
      this.error = "";
      try {
        // API 登出成功才清除畫面，避免 Cookie 還有效卻顯示已登出。
        await authService.logout();
        this.revision++;
        this.user = null;
        return true;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "登出失敗，請稍後再試。";
        return false;
      } finally {
        await finishLoading(startedAt);
        this.busy = false;
      }
    },
  },
});
