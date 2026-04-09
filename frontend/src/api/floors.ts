import { requestJson } from "./client";
import type { Floor } from "./types";

export function listFloors(token: string, posConfigId?: string) {
  const query = posConfigId
    ? `?pos_config_id=${encodeURIComponent(posConfigId)}`
    : "";

  return requestJson<{ floors: Floor[] }>(`/floors${query}`, { token });
}
