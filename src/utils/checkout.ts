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
