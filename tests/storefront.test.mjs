import assert from "node:assert/strict";
import { test } from "node:test";
import { createPinia, setActivePinia } from "pinia";
import { useCartStore } from "../src/stores/cart.ts";
import { applyCatalogQuery, parseCatalogQuery } from "../src/utils/catalog.ts";
import { readOrderSnapshot, validateCheckout } from "../src/utils/checkout.ts";

const product = {
  id: "lamp",
  slug: "lamp",
  name: "桌燈",
  brand: "Curio",
  category: "居家",
  active: true,
  price: 100,
  inventory: 5,
  images: ["/lamp.png"],
  createdAt: "2026-08-01",
};

test("商品篩選保留搜尋、價格排序與分頁行為", () => {
  const products = [
    product,
    { ...product, id: "new-lamp", price: 200, createdAt: "2026-08-02" },
    { ...product, id: "hidden-lamp", active: false },
    { ...product, id: "chair", name: "椅子", price: 300 },
  ];
  const filters = parseCatalogQuery({
    q: ["桌燈"],
    min: "100",
    sort: "price-desc",
  });
  assert.deepEqual(
    applyCatalogQuery(products, filters).items.map((item) => item.id),
    ["new-lamp", "lamp"],
  );
  assert.deepEqual(
    applyCatalogQuery(products, { ...filters, sort: "price-asc" }).items.map(
      (item) => item.id,
    ),
    ["lamp", "new-lamp"],
  );
  assert.deepEqual(
    applyCatalogQuery(products, {
      ...filters,
      sort: "newest",
      pageSize: 1,
      page: 2,
    }),
    {
      items: [product],
      total: 2,
      totalPages: 2,
    },
  );
  assert.equal(parseCatalogQuery({ sort: "unknown", page: "-2" }).page, 1);
});

test("相同商品規格不受欄位順序影響，合併數量仍受庫存限制", () => {
  const storage = new Map();
  const previousStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  try {
    setActivePinia(createPinia());
    const cart = useCartStore();
    cart.addItem(product, { 顏色: "白", 尺寸: "小" }, 2);
    cart.addItem(product, { 尺寸: "小", 顏色: "白" }, 4);
    assert.equal(cart.items.length, 1);
    assert.equal(cart.itemCount, 5);
    assert.equal(cart.subtotal, 500);
    assert.equal(JSON.parse(storage.get("curio-cart"))[0].quantity, 5);
  } finally {
    if (previousStorage)
      Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
  }
});

test("結帳欄位與訂單金額驗證在整理後仍有效", () => {
  const details = {
    name: "測試",
    email: "test@example.com",
    phone: "0912345678",
    address: "測試地址",
    payment: "cod",
  };
  assert.deepEqual(validateCheckout(details), {});
  assert.equal(
    validateCheckout({ ...details, email: "invalid" }).email,
    "請輸入有效的電子郵件",
  );
  const order = {
    orderNumber: "CR-20260916-1234",
    items: [
      {
        lineId: "lamp",
        name: "桌燈",
        image: "/lamp.png",
        unitPrice: 100,
        quantity: 2,
        inventory: 5,
        selectedOptions: { 顏色: "白" },
      },
    ],
    subtotal: 200,
    details,
  };
  assert.deepEqual(readOrderSnapshot(JSON.stringify(order)), order);
  assert.equal(
    readOrderSnapshot(JSON.stringify({ ...order, subtotal: 1 })),
    null,
  );
  assert.equal(readOrderSnapshot("invalid-json"), null);
});
