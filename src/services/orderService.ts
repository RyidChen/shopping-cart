import { authApiBaseUrl, isDemoUser, type AuthUser } from "./authService.ts";
import type { CartItem } from "../stores/cart.ts";
import type { OrderDetails, PaymentMethod } from "../utils/checkout.ts";

type OrderLine = Pick<
  CartItem,
  "productId" | "name" | "unitPrice" | "quantity" | "selectedOptions"
>;
export type OrderRecord = {
  orderNumber: string;
  createdAt: string;
  subtotal: number;
  payment: PaymentMethod;
  items: OrderLine[];
};
export type OrderPage = {
  orders: OrderRecord[];
  hasMore: boolean;
  unavailable: boolean;
};

const demoOrdersKey = "curio-demo-orders";
const pageSize = 20;
const emptyPage = (unavailable = false): OrderPage => ({
  orders: [],
  hasMore: false,
  unavailable,
});
const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function isOrderLine(value: unknown): value is OrderLine {
  return (
    isObject(value) &&
    typeof value.productId === "string" &&
    typeof value.name === "string" &&
    Number.isSafeInteger(value.unitPrice) &&
    Number(value.unitPrice) > 0 &&
    Number.isSafeInteger(value.quantity) &&
    Number(value.quantity) > 0 &&
    isObject(value.selectedOptions) &&
    Object.values(value.selectedOptions).every(
      (option) => typeof option === "string",
    )
  );
}

// API 可能回傳 HTML（例如 GitHub Pages 404）、舊格式或不完整資料；驗證後才交給畫面。
function isOrder(value: unknown): value is OrderRecord {
  return (
    isObject(value) &&
    typeof value.orderNumber === "string" &&
    /^(CR|DEMO)-[a-f0-9]{32}$/i.test(value.orderNumber) &&
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    (value.payment === "cod" || value.payment === "online") &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(isOrderLine) &&
    Number.isSafeInteger(value.subtotal) &&
    value.subtotal ===
      value.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );
}

function readDemoOrders(): OrderRecord[] {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(demoOrdersKey) ?? "[]",
    );
    return Array.isArray(data) ? data.filter(isOrder) : [];
  } catch {
    return [];
  }
}

export class OrderSubmissionError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

export function createOrderService(apiBaseUrl = "/api") {
  const url = (apiBaseUrl.replace(/\/+$/, "") || "/api") + "/orders";

  async function request(
    memberId: string,
    path = "",
    payload?: object,
  ): Promise<unknown> {
    // Cookie 才是身分依據；這個標頭只讓後端偵測其他分頁是否換了帳號。
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Expected-Member-Id": memberId,
    };
    if (payload) {
      headers["Content-Type"] = "application/json";
      headers["X-Requested-With"] = "XMLHttpRequest";
    }
    const response = await fetch(url + path, {
      credentials: "include",
      signal: AbortSignal.timeout(10_000),
      method: payload ? "POST" : "GET",
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!response.ok) {
      if (response.status === 409) {
        const problem: unknown = await response.json().catch(() => null);
        if (isObject(problem) && problem.code === "order_already_exists") {
          throw new OrderSubmissionError(
            "先前的訂單已建立，這次變更未送出。請先查看訂單紀錄。",
            409,
          );
        }
      }
      const message =
        response.status === 401
          ? "登入狀態已失效，請重新登入。"
          : response.status === 409
            ? "商品金額已變更，請重新加入商品並確認金額。"
            : response.status === 400
              ? "訂單資料、商品規格或數量不符，請確認後重試。"
              : "目前無法確認訂單是否送出，購物車已保留，請稍後重試。";
      throw new OrderSubmissionError(message, response.status);
    }
    return response.json();
  }

  return {
    async list(user: AuthUser | null, page: number): Promise<OrderPage> {
      if (!user) return emptyPage();
      if (isDemoUser(user)) {
        const all = readDemoOrders();
        return {
          orders: all.slice((page - 1) * pageSize, page * pageSize),
          hasMore: all.length > page * pageSize,
          unavailable: false,
        };
      }
      try {
        const result = await request(user.id, "?page=" + page);
        if (
          isObject(result) &&
          Array.isArray(result.orders) &&
          result.orders.every(isOrder) &&
          typeof result.hasMore === "boolean"
        ) {
          return {
            orders: result.orders,
            hasMore: result.hasMore,
            unavailable: false,
          };
        }
      } catch {
        // 讀取失敗一律顯示空清單，不讀取其他帳號或示範資料補位。
      }
      return emptyPage(true);
    },

    async get(
      user: AuthUser | null,
      orderNumber: string,
    ): Promise<OrderRecord | null> {
      if (!user) return null;
      if (isDemoUser(user))
        return (
          readDemoOrders().find((order) => order.orderNumber === orderNumber) ??
          null
        );
      try {
        const result = await request(
          user.id,
          "/" + encodeURIComponent(orderNumber),
        );
        return isOrder(result) && result.orderNumber === orderNumber
          ? result
          : null;
      } catch {
        return null;
      }
    },

    async submit(
      user: AuthUser | null,
      cart: CartItem[],
      details: OrderDetails,
      requestId: string,
    ): Promise<OrderRecord> {
      if (!user) throw new OrderSubmissionError("請先登入再送出訂單。", 401);
      if (!cart.length) throw new OrderSubmissionError("購物車沒有商品。");
      const quantities = new Map<string, number>();
      for (const line of cart) {
        const total = (quantities.get(line.productId) ?? 0) + line.quantity;
        if (!Number.isSafeInteger(line.inventory) || total > line.inventory) {
          throw new OrderSubmissionError(
            line.name +
              " 同一商品各規格合計最多 " +
              (line.inventory || 0) +
              " 件，請回購物車調整。",
          );
        }
        quantities.set(line.productId, total);
      }
      const items = cart.map(
        ({ productId, name, unitPrice, quantity, selectedOptions }) => ({
          productId,
          name,
          unitPrice,
          quantity,
          selectedOptions,
        }),
      );
      const subtotal = items.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0,
      );
      if (isDemoUser(user)) {
        const orderNumber = "DEMO-" + requestId.replaceAll("-", "");
        const all = readDemoOrders();
        const existing = all.find((order) => order.orderNumber === orderNumber);
        if (existing) return existing;
        const record = {
          orderNumber,
          createdAt: new Date().toISOString(),
          subtotal,
          payment: details.payment,
          items,
        };
        if (!isOrder(record))
          throw new OrderSubmissionError("購物車資料不完整，請重新加入商品。");
        try {
          // 示範只記商品摘要，姓名、Email、電話和地址都不寫進瀏覽器。
          localStorage.setItem(
            demoOrdersKey,
            JSON.stringify([record, ...all].slice(0, 100)),
          );
          return record;
        } catch {
          throw new OrderSubmissionError("無法儲存示範訂單，購物車已保留。");
        }
      }
      try {
        // 價格及名稱由後端商品表決定。expectedSubtotal 只用來確認顧客看到的金額。
        const result = await request(user.id, "", {
          requestId,
          expectedSubtotal: subtotal,
          details,
          items: items.map(({ productId, quantity, selectedOptions }) => ({
            productId,
            quantity,
            selectedOptions,
          })),
        });
        if (isOrder(result)) return result;
      } catch (error) {
        if (error instanceof OrderSubmissionError) throw error;
      }
      throw new OrderSubmissionError(
        "目前無法確認訂單是否送出，購物車已保留，請稍後重試。",
      );
    },
  };
}

export const orderService = createOrderService(authApiBaseUrl);
