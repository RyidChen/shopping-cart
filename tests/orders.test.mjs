import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createOrderService } from "../src/services/orderService.ts";

const real = { id: "member-1", name: "會員", email: "member@example.com" };
const demo = { id: "demo-member", name: "展示", email: "demo@curio.test" };
const order = {
  orderNumber: "CR-0123456789abcdef0123456789abcdef",
  createdAt: "2026-11-07T08:00:00Z",
  subtotal: 4360,
  payment: "cod",
  items: [
    {
      productId: "halo-lamp",
      name: "Halo 桌燈",
      unitPrice: 2180,
      quantity: 2,
      selectedOptions: { 燈色: "暖白光" },
    },
  ],
};
const cart = order.items.map((item) => ({
  ...item,
  lineId: "lamp",
  inventory: 12,
}));
const details = {
  name: "不應存進示範紀錄",
  email: "recipient@example.com",
  phone: "0912345678",
  address: "測試地址",
  payment: "cod",
};
const requestId = "01234567-89ab-4def-8123-456789abcdef";
const fetchOriginal = globalThis.fetch;
const storageOriginal = Object.getOwnPropertyDescriptor(
  globalThis,
  "localStorage",
);

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  if (storageOriginal)
    Object.defineProperty(globalThis, "localStorage", storageOriginal);
  else delete globalThis.localStorage;
});

test("真實送單只傳商品識別、數量、規格與確認金額，使用 Cookie 與固定重試鍵", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/orders");
    assert.equal(options.credentials, "include");
    assert.equal(options.method, "POST");
    assert.equal(options.headers["X-Requested-With"], "XMLHttpRequest");
    assert.equal(options.headers["X-Expected-Member-Id"], real.id);
    assert.deepEqual(JSON.parse(options.body), {
      requestId,
      expectedSubtotal: 4360,
      details,
      items: [
        {
          productId: "halo-lamp",
          quantity: 2,
          selectedOptions: { 燈色: "暖白光" },
        },
      ],
    });
    return Response.json(order, { status: 201 });
  };
  assert.deepEqual(
    await createOrderService().submit(real, cart, details, requestId),
    order,
  );
});

test("不同規格共用同商品數量上限，超過時不送出且告知商品", async () => {
  globalThis.fetch = () => assert.fail("超出上限不能呼叫 API");
  const tooMany = [
    { ...cart[0], quantity: 7 },
    { ...cart[0], lineId: "lamp-other", quantity: 6 },
  ];
  await assert.rejects(
    createOrderService().submit(real, tooMany, details, requestId),
    /Halo 桌燈.*12/,
  );
  await assert.rejects(
    createOrderService().submit(demo, tooMany, details, requestId),
    /Halo 桌燈.*12/,
  );
});

test("有未確認的舊訂單時，重試內容不同會指引查詢紀錄", async () => {
  globalThis.fetch = async () =>
    Response.json({ code: "order_already_exists" }, { status: 409 });
  await assert.rejects(
    createOrderService().submit(real, cart, details, requestId),
    /先前的訂單已建立.*訂單紀錄/,
  );
});

test("網路失敗、HTML、格式錯誤和未登入查詢都安全回空，不會生成假訂單", async () => {
  const service = createOrderService();
  for (const respond of [
    () => {
      throw new TypeError("offline");
    },
    () => new Response("<html>GitHub Pages</html>"),
    () => Response.json({ orders: [order, null], hasMore: true }),
    () => new Response(null, { status: 401 }),
  ]) {
    globalThis.fetch = async () => respond();
    assert.deepEqual(await service.list(real, 1), {
      orders: [],
      hasMore: false,
      unavailable: true,
    });
    assert.equal(await service.get(real, order.orderNumber), null);
    await assert.rejects(service.submit(real, cart, details, requestId));
  }
  globalThis.fetch = () => assert.fail("訪客不應發送訂單請求");
  await assert.rejects(service.submit(null, cart, details, requestId), /登入/);
  assert.deepEqual(await service.list(null, 1), {
    orders: [],
    hasMore: false,
    unavailable: false,
  });
});

test("只有示範會員會使用本機紀錄，同一請求不會新增兩筆，也不保存收件資料", async () => {
  const storage = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  globalThis.fetch = () => assert.fail("示範帳號不應呼叫 API");
  const service = createOrderService("/configured/api");
  const first = await service.submit(demo, cart, details, requestId);
  assert.deepEqual(await service.submit(demo, cart, details, requestId), first);
  assert.deepEqual((await service.list(demo, 1)).orders, [first]);
  assert.deepEqual(await service.get(demo, first.orderNumber), first);
  assert.ok(!JSON.stringify([...storage]).includes(details.email));
  globalThis.fetch = async () => Response.json({ orders: [], hasMore: false });
  assert.deepEqual((await service.list(real, 1)).orders, []);
});
