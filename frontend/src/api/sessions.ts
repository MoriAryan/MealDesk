import { requestJson } from "./client";
import type { PosConfig } from "./types";

export type PosSession = {
  id: string;
  pos_config_id?: string;
  opened_by?: string | null;
  status: "active" | "closed";
  opened_at: string;
  closed_at?: string | null;
  opening_cash?: number | null;
  closing_cash?: number | null;
  closing_sale_total?: number | null;
};

export async function getSessions(token: string, posConfigId: string): Promise<PosSession[]> {
  const response = await requestJson<{ posConfigs: PosConfig[] }>("/pos-config", { token });
  const config = (response.posConfigs || []).find((entry) => entry.id === posConfigId);
  return (config?.pos_sessions || []) as PosSession[];
}

export async function getActiveSession(token: string, posConfigId: string): Promise<PosSession | null> {
  const sessions = await getSessions(token, posConfigId);
  return sessions.find((session) => session.status === "active") || null;
}
