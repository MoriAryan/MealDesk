import { requestJson } from "./client";
import type { Floor } from "./types";

export function listFloors(token: string, posConfigId?: string) {
  const query = posConfigId
    ? `?pos_config_id=${encodeURIComponent(posConfigId)}`
    : "";

  return requestJson<{ floors: Floor[] }>(`/floors${query}`, { token });
}

export function createFloor(
  token: string,
  payload: { posConfigId: string; name: string }
) {
  return requestJson<{ floor: Floor }>("/floors", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateFloor(
  token: string,
  floorId: string,
  payload: { name: string }
) {
  return requestJson<{ floor: Floor }>(`/floors/${floorId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export function deleteFloor(token: string, floorId: string) {
  return requestJson<{ success: boolean }>(`/floors/${floorId}`, {
    method: "DELETE",
    token,
  });
}
