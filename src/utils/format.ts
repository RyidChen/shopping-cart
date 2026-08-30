const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number) =>
  currency.format(value).replace("$", "NT$");
