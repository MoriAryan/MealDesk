import { requestJson } from "./client";
import type { Payment } from "./types";

export async function listPayments(accessToken: string): Promise<{ payments: Payment[] }> {
  return requestJson("/payments", { token: accessToken });
}
