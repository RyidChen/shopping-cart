export type LoginCredentials = { email: string; password: string };
export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>;
export type RegistrationDetails = LoginCredentials & {
  name: string;
  confirmPassword: string;
};
export type RegistrationErrors = Partial<
  Record<keyof RegistrationDetails, string>
>;

// 只處理輸入提示；帳密是否正確，仍交由 service／後端判斷。
export function validateLogin(values: LoginCredentials): LoginErrors {
  const errors: LoginErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "請輸入有效的電子郵件";
  }
  // 密碼中的空白可能是合法字元，不可 trim 或改變大小寫。
  if (!values.password) errors.password = "請輸入密碼";
  return errors;
}

// 與 ShoppingCart.Api 的 RegisterRequest／Identity 規則一致；密碼不做 trim。
export function validateRegistration(
  values: RegistrationDetails,
): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (!values.name.trim()) errors.name = "請輸入會員名稱";
  else if (values.name.length > 50) errors.name = "會員名稱最多 50 個字";
  // 依畫面順序加入錯誤，送出時可將焦點移到最上方的無效欄位。
  Object.assign(errors, validateLogin(values));
  if (values.email.length > 254) errors.email = "電子郵件最多 254 個字元";
  if (
    values.password &&
    (values.password.length < 8 ||
      values.password.length > 128 ||
      !/[A-Z]/.test(values.password) ||
      !/[a-z]/.test(values.password) ||
      !/[0-9]/.test(values.password))
  ) {
    errors.password = "密碼須為 8～128 個字元，並包含大小寫英文字母及數字";
  }
  if (!values.confirmPassword) errors.confirmPassword = "請再次輸入密碼";
  else if (values.confirmPassword !== values.password)
    errors.confirmPassword = "兩次輸入的密碼不一致";
  return errors;
}

// query 可由使用者修改：只接受站內網址，避免外部導向或登入頁循環。
export function getAuthRedirect(value: unknown): string {
  const fallback = "/account";
  if (typeof value !== "string") return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (
      !decoded.startsWith("/") ||
      decoded.startsWith("//") ||
      /[\\\u0000-\u0020]/.test(decoded)
    ) {
      return fallback;
    }
    const url = new URL(value, "https://curio.invalid");
    if (
      url.origin !== "https://curio.invalid" ||
      /^\/(login|register)\/?$/i.test(decodeURIComponent(url.pathname))
    ) {
      return fallback;
    }
    return value;
  } catch {
    return fallback;
  }
}
