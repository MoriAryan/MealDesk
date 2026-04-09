import { requestJson } from "./client";
import type { PosConfig } from "./types";

export function listPosConfigs(token: string) {
  return requestJson<{ posConfigs: PosConfig[] }>("/pos-config", { token });
}

export function createPosConfig(token: string, name: string) {
  return requestJson<{ posConfig: PosConfig }>("/pos-config", {
    method: "POST",
    token,
    body: { name },
  });
}

export function updatePosConfig(
  token: string,
  id: string,
  payload: {
    name?: string;
    cashEnabled?: boolean;
    digitalEnabled?: boolean;
    upiEnabled?: boolean;
    upiId?: string;
    selfOrderingEnabled?: boolean;
    selfOrderingMode?: "qr" | "token" | null;
    bgColor?: string;
  }
) {
  return requestJson<{ posConfig: PosConfig }>(`/pos-config/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deletePosConfig(token: string, id: string) {
  return requestJson<void>(`/pos-config/${id}`, {
    method: "DELETE",
    token,
  });
}
