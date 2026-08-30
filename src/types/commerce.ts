export type ProductOption = { name: string; values: string[] };

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  images: string[];
  options: ProductOption[];
  tags: string[];
  featured: boolean;
  active: boolean;
  createdAt: string;
};

export type ProductSort = "newest" | "price-asc" | "price-desc";

export type ProductFilters = {
  search: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
  sort: ProductSort;
  page: number;
  pageSize: number;
};

export type CatalogResult = {
  items: Product[];
  total: number;
  totalPages: number;
};
