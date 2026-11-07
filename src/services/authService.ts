import type {
  LoginCredentials,
  RegistrationDetails,
  RegistrationErrors,
} from "../utils/auth.ts";

export type AuthUser = { id: string; name: string; email: string };

// 只將白名單內的欄位錯誤交給表單，不直接顯示後端的內部錯誤內容。
export class RegistrationError extends Error {
  fields: RegistrationErrors;

  constructor(message: string, fields: RegistrationErrors = {}) {
    super(message);
    this.fields = fields;
  }
}

function readRegistrationErrors(value: unknown): RegistrationErrors {
  const fields: RegistrationErrors = {};
  if (!value || typeof value !== "object" || !("errors" in value))
    return fields;
  const errors = value.errors;
  if (!errors || typeof errors !== "object") return fields;
  const names: Record<string, keyof RegistrationDetails> = {
    name: "name",
    email: "email",
    password: "password",
    confirmpassword: "confirmPassword",
  };
  for (const [key, messages] of Object.entries(errors)) {
    const normalized = key.toLowerCase();
    const field = Object.hasOwn(names, normalized)
      ? names[normalized]
      : undefined;
    if (field && Array.isArray(messages) && typeof messages[0] === "string") {
      fields[field] = messages[0];
    }
  }
  return fields;
}

// 公開的展示帳號，不可用於正式環境；密碼不寫入瀏覽器儲存。
export const demoCredentials = {
  email: "demo@curio.test",
  password: "Curio123!",
};
const demoUser: AuthUser = {
  id: "demo-member",
  name: "Curio 體驗會員",
  email: demoCredentials.email,
};
const sessionKey = "curio-demo-session";
const demoSessionDuration = 8 * 60 * 60 * 1000;

export function isDemoUser(user: AuthUser | null): boolean {
  return user?.id === demoUser.id && user.email === demoUser.email;
}

function readDemoSession(): AuthUser | null {
  try {
    const stored = sessionStorage.getItem(sessionKey);
    if (!stored) return null;
    const session = JSON.parse(stored);
    if (
      isAuthUser(session?.user) &&
      isDemoUser(session.user) &&
      typeof session.expiresAt === "number" &&
      session.expiresAt > Date.now()
    ) {
      // 只還原固定的示範會員，不接受本機資料宣稱的其他會員身分。
      return { ...demoUser };
    }
  } catch {
    // 儲存遭停用或內容損壞不應阻擋真實 API。
  }
  clearDemoSession();
  return null;
}

function clearDemoSession() {
  try {
    sessionStorage.removeItem(sessionKey);
  } catch {
    /* 儲存可能無法使用。 */
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<AuthUser>;
  return [user.id, user.name, user.email].every(
    (field) => typeof field === "string" && field.trim().length > 0,
  );
}

// 兩種模式共用相同介面，頁面與 store 不需要知道會員來自示範資料或 API。
export function createAuthService(apiBaseUrl = "") {
  const baseUrl = apiBaseUrl.replace(/\/+$/, "") || "/api";

  async function request(
    path: string,
    method: "GET" | "POST",
    credentials?: LoginCredentials | RegistrationDetails,
  ) {
    let response: Response;
    const signal = AbortSignal.timeout(15_000);
    const headers: Record<string, string> = { Accept: "application/json" };
    // Cookie 的寫入請求需要自訂標頭，讓後端搭配精確 CORS 阻擋跨站表單操作。
    if (method === "POST") headers["X-Requested-With"] = "XMLHttpRequest";
    if (credentials) headers["Content-Type"] = "application/json";
    try {
      response = await fetch(`${baseUrl}/auth/${path}`, {
        method,
        // 正式模式由後端透過 HttpOnly Cookie 維持登入，不把 token 放進 localStorage。
        credentials: "include",
        signal,
        headers,
        body: credentials ? JSON.stringify(credentials) : undefined,
      });
    } catch {
      if (signal.aborted) throw new Error("會員服務回應逾時，請稍後再試。");
      throw new Error("無法連線至會員服務，請確認網路後重試。");
    }
    if (response.status === 401 && (path === "me" || path === "logout"))
      return null;
    if (!response.ok) {
      if (path === "register" && response.status === 409) {
        const message = "此電子郵件已註冊，請直接登入。";
        throw new RegistrationError(message, { email: message });
      }
      if (path === "register" && response.status === 400) {
        const problem: unknown = await response.json().catch(() => null);
        throw new RegistrationError(
          "註冊資料不符合規則，請檢查後重試。",
          readRegistrationErrors(problem),
        );
      }
      if (
        path === "login" &&
        (response.status === 401 || response.status === 400)
      ) {
        throw new Error("電子郵件或密碼不正確，請再試一次。");
      }
      if (response.status === 429)
        throw new Error("操作過於頻繁，請稍後再試。");
      throw new Error("會員服務暫時無法使用，請稍後再試。");
    }
    if (path === "logout") return null;
    const user: unknown = await response.json().catch(() => null);
    if (!isAuthUser(user))
      throw new Error("會員服務回傳的資料格式不正確，請稍後再試。");
    return user;
  }

  return {
    async register(details: RegistrationDetails): Promise<AuthUser> {
      // 不在前端模擬保存新帳密，真正的建立會員與密碼雜湊只交給後端。
      return (await request("register", "POST", {
        name: details.name.trim(),
        email: details.email.trim().toLowerCase(),
        password: details.password,
        confirmPassword: details.confirmPassword,
      }))!;
    },

    async login(credentials: LoginCredentials): Promise<AuthUser> {
      const values = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      };
      if (values.email !== demoCredentials.email) {
        const member = (await request("login", "POST", values))!;
        clearDemoSession();
        return member;
      }
      if (values.password !== demoCredentials.password) {
        throw new Error("電子郵件或密碼不正確，請再試一次。");
      }
      try {
        // ponytail: 僅保存八小時的示範狀態；正式模式改由 /auth/me 驗證伺服器工作階段。
        sessionStorage.setItem(
          sessionKey,
          JSON.stringify({
            user: demoUser,
            expiresAt: Date.now() + demoSessionDuration,
          }),
        );
      } catch {
        throw new Error("瀏覽器無法儲存登入狀態，請允許網站儲存資料後重試。");
      }
      return { ...demoUser };
    },

    async getCurrentUser(): Promise<AuthUser | null> {
      return readDemoSession() ?? request("me", "GET");
    },

    async logout(): Promise<void> {
      if (!readDemoSession()) {
        await request("logout", "POST");
        return;
      }
      try {
        sessionStorage.removeItem(sessionKey);
      } catch {
        throw new Error("無法清除登入狀態，請允許網站儲存資料後重試。");
      }
    },
  };
}

// 未設定外部網址時，一般會員仍走同源 API。
export const authApiBaseUrl: string =
  import.meta.env?.VITE_API_BASE_URL?.trim() || "/api";
export const authService = createAuthService(authApiBaseUrl);
