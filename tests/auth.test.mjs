import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { registerAuthGuard } from "../src/router/authGuard.ts";
import {
  createAuthService,
  authService,
  demoCredentials,
} from "../src/services/authService.ts";
import { useAuthStore } from "../src/stores/auth.ts";
import {
  getAuthRedirect,
  validateLogin,
  validateRegistration,
} from "../src/utils/auth.ts";

const registration = {
  name: "測試會員",
  email: "new-member@example.com",
  password: "Curio123!",
  confirmPassword: "Curio123!",
};

const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);
const originalFetch = globalThis.fetch;
const realCredentials = {
  email: "member@example.com",
  password: "TestPass123!",
};
const originalService = { ...authService };
let storage;

beforeEach(() => {
  globalThis.fetch = async () => new Response(null, { status: 401 });
  storage = new Map();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  });
  setActivePinia(createPinia());
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  Object.assign(authService, originalService);
  if (originalStorage)
    Object.defineProperty(globalThis, "sessionStorage", originalStorage);
  else delete globalThis.sessionStorage;
});

test("登入驗證提示缺漏與無效 Email，但不擅自修剪密碼", () => {
  assert.deepEqual(validateLogin({ email: "", password: "" }), {
    email: "請輸入有效的電子郵件",
    password: "請輸入密碼",
  });
  assert.deepEqual(
    validateLogin({ email: "  demo@curio.test  ", password: "  " }),
    {},
  );
  assert.ok(validateLogin({ email: "invalid", password: "test" }).email);
});

test("僅接受站內返回頁，拒絕外部網址與登入循環", () => {
  assert.equal(getAuthRedirect("/products?q=lamp#top"), "/products?q=lamp#top");
  for (const target of [
    undefined,
    ["/cart"],
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2fevil.test",
    "/%5cevil.test",
    "/\nevil.test",
    "/login?redirect=/login",
    "/login/",
    "/%ZZ",
  ]) {
    assert.equal(getAuthRedirect(target), "/account", String(target));
  }
});

test("示範登入可還原與登出，儲存內容不含密碼", async () => {
  const service = createAuthService();
  assert.equal(await service.getCurrentUser(), null);
  const configured = createAuthService("https://api.example.com/api");
  globalThis.fetch = () => assert.fail("設定 API 後示範帳號仍應獨立運作");
  const user = await configured.login({
    ...demoCredentials,
    email: " DEMO@CURIO.TEST ",
  });
  assert.equal(user.email, demoCredentials.email);
  assert.deepEqual(await createAuthService().getCurrentUser(), user);
  assert.ok(!JSON.stringify([...storage]).includes(demoCredentials.password));
  await configured.logout();
  globalThis.fetch = async () => new Response(null, { status: 401 });
  assert.equal(await service.getCurrentUser(), null);
  assert.equal(storage.size, 0);
});

test("錯誤密碼或不存在的帳號不會建立登入狀態", async () => {
  const service = createAuthService();
  await assert.rejects(
    service.login({ ...demoCredentials, password: "wrong" }),
    /電子郵件或密碼不正確/,
  );
  await assert.rejects(
    service.login({ ...demoCredentials, email: "unknown@curio.test" }),
    /電子郵件或密碼不正確/,
  );
  assert.equal(await service.getCurrentUser(), null);
});

test("過期、損毀及格式不符的示範狀態會被清除", async () => {
  const service = createAuthService();
  await service.login(demoCredentials);
  const key = [...storage.keys()][0];
  const session = JSON.parse(storage.get(key));
  for (const stored of [
    "invalid-json",
    "null",
    JSON.stringify({ ...session, expiresAt: 1 }),
    JSON.stringify({ ...session, user: { name: "invalid" } }),
    JSON.stringify({ ...session, expiresAt: "tomorrow" }),
  ]) {
    storage.set(key, stored);
    assert.equal(await service.getCurrentUser(), null);
    assert.equal(storage.has(key), false);
  }
});

test("瀏覽器阻擋儲存時可開啟頁面，登入失敗提供可讀錯誤", async () => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    get() {
      throw new Error("blocked");
    },
  });
  const service = createAuthService();
  assert.equal(await service.getCurrentUser(), null);
  await assert.rejects(service.login(demoCredentials), /瀏覽器.*儲存/);
});

test("API 模式使用 Cookie 與約定端點，不寫入示範儲存", async () => {
  const user = { id: "user-1", name: "會員", email: "user@example.com" };
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return options.method === "POST" && url.endsWith("/logout")
      ? new Response(null, { status: 204 })
      : Response.json(user);
  };
  const service = createAuthService("https://api.example.com/api/");
  assert.deepEqual(
    await service.login({ email: " user@example.com ", password: " pass " }),
    user,
  );
  assert.deepEqual(await service.getCurrentUser(), user);
  await service.logout();
  assert.deepEqual(
    calls.map(({ url }) => url),
    [
      "https://api.example.com/api/auth/login",
      "https://api.example.com/api/auth/me",
      "https://api.example.com/api/auth/logout",
    ],
  );
  assert.ok(calls.every(({ options }) => options.credentials === "include"));
  assert.ok(
    calls.every(({ options }) => options.signal instanceof AbortSignal),
  );
  assert.ok(
    calls
      .filter(({ options }) => options.method === "POST")
      .every(
        ({ options }) =>
          options.headers["X-Requested-With"] === "XMLHttpRequest",
      ),
  );
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    email: "user@example.com",
    password: " pass ",
  });
  assert.equal(storage.size, 0);
});

test("API 的未登入、限流、伺服器及網路失敗不會被當成登入成功", async () => {
  const service = createAuthService("https://api.example.com/api");
  globalThis.fetch = async () => new Response(null, { status: 401 });
  assert.equal(await service.getCurrentUser(), null);
  await service.logout(); // Cookie 已失效時，登出仍應完成。
  await assert.rejects(service.login(realCredentials), /電子郵件或密碼不正確/);
  globalThis.fetch = async () => new Response(null, { status: 429 });
  await assert.rejects(service.login(realCredentials), /頻繁/);
  globalThis.fetch = async () =>
    new Response("<html>error</html>", { status: 500 });
  await assert.rejects(service.login(realCredentials), /服務暫時無法使用/);
  globalThis.fetch = async () => Response.json({ token: "unexpected-shape" });
  await assert.rejects(service.getCurrentUser(), /資料格式/);
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(service.login(realCredentials), /無法連線/);
});

test("API 請求逾時會中止並提供可重試提示", async (t) => {
  const controller = new AbortController();
  t.mock.method(AbortSignal, "timeout", (duration) => {
    assert.equal(duration, 15_000);
    return controller.signal;
  });
  globalThis.fetch = async (_url, options) => {
    controller.abort();
    options.signal.throwIfAborted();
  };
  await assert.rejects(
    createAuthService("/api").login(realCredentials),
    /回應逾時/,
  );
});

test("store 還原會員、更新登入狀態並在登出後清除", async () => {
  const auth = useAuthStore();
  await auth.restoreSession();
  assert.equal(auth.initialized, true);
  assert.equal(auth.isAuthenticated, false);
  assert.equal(await auth.login(demoCredentials), true);
  assert.equal(auth.isAuthenticated, true);
  setActivePinia(createPinia());
  const restored = useAuthStore();
  await restored.restoreSession();
  assert.deepEqual(restored.user, auth.user);
  assert.equal(await restored.logout(), true);
  assert.equal(restored.user, null);
  assert.equal(restored.busy, false);
});

test("快速登入與登出仍保留短暫 loading，期間不接受重複送出", async () => {
  const auth = useAuthStore();
  for (const action of [
    () => auth.login(demoCredentials),
    () => auth.logout(),
  ]) {
    const startedAt = Date.now();
    const pending = action();
    assert.equal(auth.busy, true);
    assert.equal(await action(), false);
    assert.equal(await pending, true);
    assert.ok(Date.now() - startedAt >= 500, "過場至少顯示約半秒");
    assert.equal(auth.busy, false);
  }
});

test("store 錯誤可恢復，登出請求失敗仍保留會員", async () => {
  const auth = useAuthStore();
  assert.equal(
    await auth.login({ ...demoCredentials, password: "wrong" }),
    false,
  );
  assert.ok(auth.error);
  assert.equal(auth.busy, false);
  assert.equal(await auth.login(demoCredentials), true);
  assert.equal(auth.error, "");
  authService.logout = async () => {
    throw new Error("暫時無法登出，請重試");
  };
  assert.equal(await auth.logout(), false);
  assert.equal(auth.isAuthenticated, true);
  assert.match(auth.error, /請重試/);
  authService.getCurrentUser = async () => {
    throw new Error("無法連線");
  };
  await auth.restoreSession();
  assert.equal(auth.user, null);
  assert.equal(auth.error, "無法連線");
});

test("會員頁守衛還原狀態，訪客登入後回到原頁，會員不重複進入登入頁", async () => {
  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: {} },
      { path: "/login", component: {}, meta: { guestOnly: true } },
      { path: "/account", component: {}, meta: { requiresAuth: true } },
      { path: "/cart", component: {} },
    ],
  });
  registerAuthGuard(router, pinia);
  await router.push("/account?tab=profile");
  assert.equal(router.currentRoute.value.path, "/login");
  assert.equal(
    router.currentRoute.value.query.redirect,
    "/account?tab=profile",
  );
  const auth = useAuthStore(pinia);
  await auth.login(demoCredentials);
  await router.push(getAuthRedirect(router.currentRoute.value.query.redirect));
  assert.equal(router.currentRoute.value.fullPath, "/account?tab=profile");
  await router.push("/login?redirect=/cart");
  assert.equal(router.currentRoute.value.path, "/cart");
  await auth.logout();
  await router.push("/account");
  assert.equal(router.currentRoute.value.path, "/login");
  assert.equal(auth.user, null);
});

test("會員頁每次進入重新確認登入，過期或 API 401 導回登入頁", async () => {
  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: {} },
      { path: "/login", component: {}, meta: { guestOnly: true } },
      { path: "/account", component: {}, meta: { requiresAuth: true } },
    ],
  });
  registerAuthGuard(router, pinia);
  const auth = useAuthStore(pinia);
  await auth.login(demoCredentials);
  await router.push("/");
  authService.getCurrentUser = async () => null;
  await router.push("/account");
  assert.equal(router.currentRoute.value.path, "/login");
  assert.equal(auth.isAuthenticated, false);
});

test("會員服務沒有回應也不阻擋訪客開啟結帳頁", async () => {
  const pinia = createPinia();
  let finishRestore;
  authService.getCurrentUser = () =>
    new Promise((resolve) => {
      finishRestore = resolve;
    });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/checkout", component: {} }],
  });
  registerAuthGuard(router, pinia);
  const navigation = router.push("/checkout");
  const opened = await Promise.race([
    navigation.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 100)),
  ]);
  finishRestore(null);
  await navigation;
  assert.equal(opened, true, "公開頁不應等待會員查詢");
  assert.equal(router.currentRoute.value.path, "/checkout");
});

test("舊會員查詢不得在登出成功後重新登入會員", async () => {
  const auth = useAuthStore();
  await auth.login(demoCredentials);
  const oldUser = { ...auth.user };
  let finishRestore;
  authService.getCurrentUser = () =>
    new Promise((resolve) => {
      finishRestore = resolve;
    });
  const restoring = auth.restoreSession();
  await auth.logout();
  finishRestore(oldUser);
  await restoring;
  assert.equal(auth.user, null);
});

test("登入成功前啟動的會員查詢不得覆寫新登入", async () => {
  const auth = useAuthStore();
  let finishRestore;
  authService.getCurrentUser = () =>
    new Promise((resolve) => {
      finishRestore = resolve;
    });
  const restoring = auth.restoreSession();
  await auth.login(demoCredentials);
  finishRestore(null);
  await restoring;
  assert.equal(auth.user.email, demoCredentials.email);
});

test("註冊驗證與後端一致，保留密碼空白並檢查確認密碼", () => {
  assert.deepEqual(validateRegistration(registration), {});
  assert.deepEqual(
    validateRegistration({
      ...registration,
      password: " Curio123! ",
      confirmPassword: " Curio123! ",
    }),
    {},
  );
  const missing = validateRegistration({
    name: "  ",
    email: "invalid",
    password: "",
    confirmPassword: "",
  });
  assert.equal(Object.keys(missing)[0], "name", "依畫面順序聚焦第一個錯誤欄位");
  assert.deepEqual(Object.keys(missing).sort(), [
    "confirmPassword",
    "email",
    "name",
    "password",
  ]);
  assert.ok(
    validateRegistration({ ...registration, name: "a".repeat(51) }).name,
  );
  assert.ok(
    validateRegistration({
      ...registration,
      email: `${"a".repeat(250)}@x.test`,
    }).email,
  );
  for (const password of [
    "short",
    "lowercase123",
    "UPPERCASE123",
    "NoDigitsHere",
    `Aa1${"a".repeat(126)}`,
  ]) {
    assert.ok(
      validateRegistration({
        ...registration,
        password,
        confirmPassword: password,
      }).password,
    );
  }
  assert.ok(
    validateRegistration({ ...registration, confirmPassword: "different" })
      .confirmPassword,
  );
});

test("註冊 API 傳送四個欄位與必要標頭，成功不建立登入狀態", async () => {
  const user = {
    id: "new-member",
    name: registration.name,
    email: registration.email,
  };
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return Response.json(user, { status: 201 });
  };
  const service = createAuthService("http://127.0.0.1:5000/api");
  assert.deepEqual(
    await service.register({
      ...registration,
      name: " 測試會員 ",
      email: " NEW-MEMBER@EXAMPLE.COM ",
    }),
    user,
  );
  assert.equal(captured.url, "http://127.0.0.1:5000/api/auth/register");
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.credentials, "include");
  assert.equal(captured.options.headers["X-Requested-With"], "XMLHttpRequest");
  assert.deepEqual(JSON.parse(captured.options.body), registration);
  assert.equal(storage.size, 0);
});

test("重複 Email 與後端欄位驗證能對應到註冊欄位", async () => {
  const service = createAuthService("/api");
  globalThis.fetch = async () =>
    Response.json({ title: "Conflict" }, { status: 409 });
  await assert.rejects(service.register(registration), (error) => {
    assert.match(error.message, /已註冊/);
    assert.match(error.fields.email, /已註冊/);
    return true;
  });
  globalThis.fetch = async () =>
    Response.json(
      {
        errors: {
          Name: ["姓名過長"],
          password: ["密碼須包含大寫英文字母"],
          ConfirmPassword: ["密碼不一致"],
          unrelated: ["不要顯示"],
        },
      },
      { status: 400 },
    );
  await assert.rejects(service.register(registration), (error) => {
    assert.deepEqual(error.fields, {
      name: "姓名過長",
      password: "密碼須包含大寫英文字母",
      confirmPassword: "密碼不一致",
    });
    return true;
  });
  globalThis.fetch = async () => new Response("not-json", { status: 400 });
  await assert.rejects(service.register(registration), /註冊資料/);
  globalThis.fetch = async () => new Response(null, { status: 401 });
  await assert.rejects(service.register(registration));
});

test("未設定網址時，一般會員仍走同源 API，失敗不保存帳號或密碼", async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    return new Response("<html>Not found</html>", { status: 404 });
  };
  await assert.rejects(
    createAuthService().register(registration),
    /會員服務暫時無法使用/,
  );
  await assert.rejects(
    createAuthService().login(realCredentials),
    /會員服務暫時無法使用/,
  );
  assert.deepEqual(calls, ["/api/auth/register", "/api/auth/login"]);
  assert.equal(storage.size, 0);
});

test("store 註冊提供 loading 與欄位錯誤，成功後仍保持未登入", async () => {
  const auth = useAuthStore();
  const realRegistration = createAuthService("/api");
  authService.register = realRegistration.register;
  globalThis.fetch = async () => Response.json({}, { status: 409 });
  assert.equal(await auth.register(registration), false);
  assert.ok(auth.registrationErrors.email);
  assert.equal(auth.busy, false);
  assert.equal(auth.user, null);
  globalThis.fetch = async () =>
    Response.json(
      { id: "new", name: registration.name, email: registration.email },
      { status: 201 },
    );
  const pending = auth.register(registration);
  assert.equal(auth.busy, true);
  assert.equal(await auth.register(registration), false);
  assert.equal(await pending, true);
  assert.equal(auth.error, "");
  assert.deepEqual(auth.registrationErrors, {});
  assert.equal(auth.user, null);
  assert.equal(auth.busy, false);
});

test("登入返回網址不得指向註冊頁，避免會員導向循環", () => {
  assert.equal(getAuthRedirect("/register?redirect=/account"), "/account");
  assert.equal(getAuthRedirect("/register/"), "/account");
});
