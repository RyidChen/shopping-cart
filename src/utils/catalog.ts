import type {
  CatalogResult,
  Product,
  ProductFilters,
  ProductOption,
} from "../types/commerce";

// Vue Router 的查詢參數可能是單值或陣列；陣列情況統一採用第一個值。
const queryValue = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

// 空值與非有限數字都視為未設定，避免無效價格條件進入篩選流程。
const optionalNumber = (value: unknown) => {
  const raw = queryValue(value);
  if (raw === undefined || raw === null || raw === "") return undefined;
  const number = Number(raw);
  return Number.isFinite(number) ? number : undefined;
};

/**
 * 將網址查詢參數轉成可直接使用的商品篩選條件。
 * 未知排序回退為最新上架，頁碼最低為 1，每頁固定顯示 12 件。
 */
export function parseCatalogQuery(
  query: Record<string, unknown>,
): ProductFilters {
  const sort = queryValue(query.sort);
  const page = Math.trunc(optionalNumber(query.page) ?? 1);

  return {
    search: String(queryValue(query.q) ?? ""),
    category: String(queryValue(query.category) ?? ""),
    minPrice: optionalNumber(query.min),
    maxPrice: optionalNumber(query.max),
    sort:
      sort === "price-asc" || sort === "price-desc" || sort === "newest"
        ? sort
        : "newest",
    page: Math.max(1, page),
    pageSize: 12,
  };
}

/** 回傳尚未選擇的必選規格名稱，空陣列表示商品規格已選完整。 */
export const missingOptionNames = (
  options: ProductOption[],
  selectedOptions: Record<string, string>,
) =>
  options
    .filter((option) => !selectedOptions[option.name])
    .map((option) => option.name);

/**
 * 套用啟用狀態、關鍵字、分類、價格、排序與分頁，回傳目前頁面的商品及總頁數。
 */
export function applyCatalogQuery(
  products: Product[],
  filters: ProductFilters,
): CatalogResult {
  const search = filters.search.toLowerCase();
  const matching = products
    .filter((product) => product.active)
    .filter(
      (product) =>
        !search ||
        `${product.name} ${product.brand}`.toLowerCase().includes(search),
    )
    .filter(
      (product) => !filters.category || product.category === filters.category,
    )
    .filter(
      (product) =>
        filters.minPrice === undefined || product.price >= filters.minPrice,
    )
    .filter(
      (product) =>
        filters.maxPrice === undefined || product.price <= filters.maxPrice,
    )
    .sort((a, b) => {
      if (filters.sort === "price-asc") return a.price - b.price;
      if (filters.sort === "price-desc") return b.price - a.price;
      return b.createdAt.localeCompare(a.createdAt);
    });

  // 先以完整結果計算頁數，再只擷取目前頁面的資料。
  const total = matching.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const start = (filters.page - 1) * filters.pageSize;

  return {
    items: matching.slice(start, start + filters.pageSize),
    total,
    totalPages,
  };
}
