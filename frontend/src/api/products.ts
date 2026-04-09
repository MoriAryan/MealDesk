import { requestJson } from "./client";
import type { Product, ProductVariant, TaxRate } from "./types";

export function listProducts(token: string, params?: { posConfigId?: string; categoryId?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.posConfigId) query.set("pos_config_id", params.posConfigId);
  if (params?.categoryId) query.set("category_id", params.categoryId);
  if (params?.search) query.set("search", params.search);
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson<{ products: Product[] }>(`/products${suffix}`, { token });
}

export function getProduct(token: string, id: string) {
  return requestJson<{ product: Product; variants: ProductVariant[] }>(`/products/${id}`, { token });
}

export function createProduct(
  token: string,
  payload: {
    posConfigId: string;
    categoryId: string;
    taxRateId: string;
    name: string;
    description?: string;
    price: number;
    uom: Product["uom"];
    imageUrl?: string | null;
    variants: Array<{
      attributeName: string;
      value: string;
      unit: ProductVariant["unit"];
      extraPrice: number;
    }>;
  }
) {
  return requestJson<{ product: Product }>("/products", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateProduct(
  token: string,
  id: string,
  payload: {
    categoryId?: string;
    taxRateId?: string;
    name?: string;
    description?: string | null;
    price?: number;
    uom?: Product["uom"];
    active?: boolean;
    imageUrl?: string | null;
    variants?: Array<{
      id?: string;
      attributeName: string;
      value: string;
      unit: ProductVariant["unit"];
      extraPrice: number;
    }>;
  }
) {
  return requestJson<{ product: Product }>(`/products/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function archiveProducts(token: string, ids: string[]) {
  return requestJson<void>("/products/bulk-archive", {
    method: "PATCH",
    token,
    body: { ids },
  });
}

export function deleteProducts(token: string, ids: string[]) {
  return requestJson<void>("/products/bulk-delete", {
    method: "DELETE",
    token,
    body: { ids },
  });
}

export function listTaxRates(token: string) {
  return requestJson<{ taxRates: TaxRate[] }>("/tax-rates", { token });
}
