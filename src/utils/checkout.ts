export type PaymentMethod = "cod" | "online";

export type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  payment: PaymentMethod | "" | (string & {});
};

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

export type OrderSnapshot = {
  orderNumber: string;
  items: OrderLine[];
  subtotal: number;
  details: OrderDetails;
};

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

export const createOrderNumber = (
  date = new Date(),
  random = () => Math.floor(Math.random() * 10_000),
) => {
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => (index ? String(part).padStart(2, "0") : part))
    .join("");
  return `CR-${day}-${String(random()).padStart(4, "0").slice(-4)}`;
};

export const readOrderSnapshot = (
  stored: string | null,
): OrderSnapshot | null => {
  try {
    const value: unknown = stored && JSON.parse(stored);
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
    return items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    ) === value.subtotal
      ? {
          orderNumber: value.orderNumber,
          details: value.details,
          items,
          subtotal: value.subtotal,
        }
      : null;
  } catch {
    return null;
  }
};

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

const isOrderDetails = (value: unknown): value is OrderDetails =>
  isRecord(value) &&
  isRequiredString(value.name) &&
  isRequiredString(value.email) &&
  isRequiredString(value.phone) &&
  isRequiredString(value.address) &&
  (value.payment === "cod" || value.payment === "online");

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
