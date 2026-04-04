import { requestJson } from "./client";
import type { Category } from "./types";

export function listCategories(token: string, posConfigId?: string) {
  const query = posConfigId ? `?pos_config_id=${encodeURIComponent(posConfigId)}` : "";
  return requestJson<{ categories: Category[] }>(`/categories${query}`, { token });
}

export function createCategory(token: string, payload: { posConfigId: string; name: string; color?: string }) {
  return requestJson<{ category: Category }>("/categories", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateCategory(token: string, id: string, payload: { name?: string; color?: string }) {
  return requestJson<{ category: Category }>(`/categories/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteCategory(token: string, id: string) {
  return requestJson<void>(`/categories/${id}`, {
    method: "DELETE",
    token,
  });
}
