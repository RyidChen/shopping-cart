import { products } from "../data/products";
import type { CatalogResult, Product, ProductFilters } from "../types/commerce";
import { applyCatalogQuery } from "../utils/catalog";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

export async function queryProducts(
  filters: ProductFilters,
): Promise<CatalogResult> {
  await wait();
  return applyCatalogQuery(structuredClone(products), filters);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await wait();
  return structuredClone(
    products.find((product) => product.slug === slug && product.active) ?? null,
  );
}
