import { requestJson } from "./client";
import type { Order } from "./types";

export async function listOrders(accessToken: string): Promise<{ orders: Order[] }> {
  return requestJson("/orders", { token: accessToken });
}
