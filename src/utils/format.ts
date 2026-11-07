// Formatter 在模組載入時建立一次，避免商品列表渲染時重複建立物件。
const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

/** 將數字格式化為不顯示小數的台幣金額，並統一使用清楚的「NT$」前綴。 */
export const formatCurrency = (value: number) =>
  currency.format(value).replace("$", "NT$");

const orderDate = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Taipei",
});
export const formatOrderDate = (value: string) =>
  orderDate.format(new Date(value));
