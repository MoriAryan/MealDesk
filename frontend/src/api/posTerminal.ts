import { requestJson } from "./client";
import type { CartItem } from "../layouts/PosTerminalLayout";
import type { Order } from "./types";

interface SubmitOrderParams {
  posConfigId: string;
  tableId: string | null;
  items: CartItem[];
  status?: "draft" | "paid" | "archived";
  createKitchenTicket?: boolean;
}

export function submitPosOrder(token: string, params: SubmitOrderParams) {
  return requestJson<{ order: Order, ticket: any }>("/pos-terminal/order", {
    method: "POST",
    token,
    body: params,
  });
}
