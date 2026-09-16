// 結帳欄位驗證、訂單編號、儲存訂單資料的安全解析
export type PaymentMethod = "cod" | "online";

/** 結帳表單尚未驗證的輸入資料；payment 未選擇時為空字串。 */
export type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  payment: PaymentMethod | "";
};

/** 以欄位名稱為鍵的錯誤集合；空物件表示所有欄位皆通過驗證。 */
export type CheckoutErrors = Partial<Record<keyof CheckoutDetails, string>>;

export type OrderDetails = Omit<CheckoutDetails, "payment"> & {
  payment: PaymentMethod;
};

export type OrderLine = {
  lineId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  inventory: number;
  selectedOptions: Record<string, string>;
};

/** 儲存在 sessionStorage 的訂單快照，用於付款完成頁重新載入後顯示。 */
export type OrderSnapshot = {
  orderNumber: string;
  items: OrderLine[];
  subtotal: number;
  details: OrderDetails;
};

/**
 * 驗證結帳欄位並回傳各欄位錯誤。
 * 電話會先移除空白與連字號，再檢查是否為 8～15 位數字。
 */
export const validateCheckout = (details: CheckoutDetails): CheckoutErrors => {
  const errors: CheckoutErrors = {};
  if (!details.name.trim()) errors.name = "請輸入收件人姓名";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()))
    errors.email = "請輸入有效的電子郵件";
  if (!/^\d{8,15}$/.test(details.phone.replace(/[\s-]/g, "")))
    errors.phone = "請輸入有效的聯絡電話";
  if (!details.address.trim()) errors.address = "請輸入配送地址";
  if (details.payment !== "cod" && details.payment !== "online")
    errors.payment = "請選擇付款方式";
  return errors;
};

/** 建立「CR-YYYYMMDD-####」格式的前端展示用訂單編號。 */
export const createOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const sequence = String(Math.floor(Math.random() * 10_000)).padStart(4, "0");

  return `CR-${year}${month}${day}-${sequence}`;
};

/**
 * 解析並驗證外部儲存的訂單快照；格式錯誤、欄位缺漏或總額不符時回傳 null。
 * 訂單成功頁使用，避免格式不完整的 sessionStorage 資料造成畫面錯誤。
 * 這是前端資料格式驗證；真實訂單與金額仍須由伺服器確認。
 */
export const readOrderSnapshot = (
  stored: string | null,
): OrderSnapshot | null => {
  try {
    const value: unknown = stored && JSON.parse(stored);
    // 做檢查
    /**
     * JSON 格式能不能正確解析
        訂單編號是否符合 CR-YYYYMMDD-####
        姓名、Email、電話和地址是否存在
        付款方式是否為 cod 或 online
        商品陣列是否存在且至少有一件商品
        每項商品的名稱、價格、數量、庫存和規格是否合法
        商品數量是否沒有超過庫存
        subtotal 是否等於所有商品的「單價 × 數量」總和
     */
    if (
      !isRecord(value) ||
      !isRequiredString(value.orderNumber) ||
      !/^CR-\d{8}-\d{4}$/.test(value.orderNumber) ||
      !isOrderDetails(value.details) ||
      !Array.isArray(value.items) ||
      !value.items.length ||
      !isNonNegativeInteger(value.subtotal)
    )
      return null;
    if (!value.items.every(isOrderLine)) return null;
    const items = value.items as OrderLine[];
    const subtotal = items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    );
    if (subtotal !== value.subtotal) return null;

    return {
      orderNumber: value.orderNumber,
      details: value.details,
      items,
      subtotal,
    };
  } catch {
    return null;
  }
};

// JSON.parse 的結果屬於 unknown，以下型別守衛會逐層確認資料結構後才交給畫面使用。
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isRequiredString = (value: unknown): value is string =>
  typeof value === "string" && Boolean(value.trim());

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const isStringMap = (value: unknown): value is Record<string, string> =>
  isRecord(value) &&
  Object.entries(value).every(
    ([key, item]) => isRequiredString(key) && isRequiredString(item),
  );

// 負責檢查訂單中的「顧客與配送資料」
const isOrderDetails = (value: unknown): value is OrderDetails =>
  isRecord(value) &&
  isRequiredString(value.name) &&
  isRequiredString(value.email) &&
  isRequiredString(value.phone) &&
  isRequiredString(value.address) &&
  (value.payment === "cod" || value.payment === "online");

// 負責檢查訂單中的「商品明細」
const isOrderLine = (value: unknown): value is OrderLine =>
  isRecord(value) &&
  isRequiredString(value.lineId) &&
  isRequiredString(value.name) &&
  isRequiredString(value.image) &&
  isPositiveInteger(value.unitPrice) &&
  isPositiveInteger(value.quantity) &&
  isPositiveInteger(value.inventory) &&
  value.quantity <= value.inventory &&
  isStringMap(value.selectedOptions);
