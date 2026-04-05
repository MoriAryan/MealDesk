import { requestJson } from "./client";
import type { Order } from "./types";

interface ListOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export async function listOrders(accessToken: string, page = 1, limit = 50): Promise<ListOrdersResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  return requestJson(`/orders?${params}`, { token: accessToken });
}
