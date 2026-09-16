// 商品資料存取邊界，模擬 120ms 非同步請求
import { products } from "../data/products";
import type { CatalogResult, Product, ProductFilters } from "../types/commerce";
import { applyCatalogQuery } from "../utils/catalog";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

// 查詢商品清單，依照篩選條件回傳結果  模擬查詢
export async function queryProducts(
  filters: ProductFilters,
): Promise<CatalogResult> {
  await wait();
  return applyCatalogQuery(products, filters);
}

// 依照 slug 查詢單一商品，若不存在或未上架則回傳 null  模擬取得詳情頁
export async function getProductBySlug(slug: string): Promise<Product | null> {
  await wait();
  return structuredClone(
    products.find((product) => product.slug === slug && product.active) ?? null,
  );
}
