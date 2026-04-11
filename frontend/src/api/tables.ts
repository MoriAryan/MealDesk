import { requestJson } from "./client";
import type { DiningTable } from "./types";

type TableFilters = {
  posConfigId?: string;
  floorId?: string;
  active?: boolean;
};

export function listTables(token: string, filters: TableFilters = {}) {
  const params = new URLSearchParams();
  if (filters.posConfigId) params.set("pos_config_id", filters.posConfigId);
  if (filters.floorId) params.set("floor_id", filters.floorId);
  if (typeof filters.active !== "undefined") params.set("active", String(filters.active));

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestJson<{ tables: DiningTable[] }>(`/tables${suffix}`, { token });
}

export function createTable(
  token: string,
  payload: { floorId: string; tableNumber: string; seats: number }
) {
  return requestJson<{ table: DiningTable }>("/tables", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateTable(
  token: string,
  id: string,
  payload: { tableNumber?: string; seats?: number }
) {
  return requestJson<{ table: DiningTable }>(`/tables/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export function deleteTable(token: string, id: string) {
  return requestJson<undefined>(`/tables/${id}`, {
    method: "DELETE",
    token,
  });
}
