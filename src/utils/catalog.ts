import type {
  CatalogResult,
  Product,
  ProductFilters,
  ProductOption,
} from "../types/commerce";

const queryValue = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

const optionalNumber = (value: unknown) => {
  const raw = queryValue(value);
  if (raw === undefined || raw === null || raw === "") return undefined;
  const number = Number(raw);
  return Number.isFinite(number) ? number : undefined;
};

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

export const missingOptionNames = (
  options: ProductOption[],
  selectedOptions: Record<string, string>,
) =>
  options
    .filter((option) => !selectedOptions[option.name])
    .map((option) => option.name);

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
    .map((product, index) => ({ product, index }))
    .sort((a, b) => {
      const difference =
        filters.sort === "newest"
          ? b.product.createdAt.localeCompare(a.product.createdAt)
          : filters.sort === "price-asc"
            ? a.product.price - b.product.price
            : b.product.price - a.product.price;
      return difference || a.index - b.index;
    });

  const total = matching.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const start = (filters.page - 1) * filters.pageSize;

  return {
    items: matching
      .slice(start, start + filters.pageSize)
      .map(({ product }) => product),
    total,
    totalPages,
  };
}
