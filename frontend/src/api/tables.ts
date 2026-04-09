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
