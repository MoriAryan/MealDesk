import { requestJson } from "./client";
import type { CartItem } from "../layouts/PosTerminalLayout";
import type { Order } from "./types";

interface SubmitOrderParams {
  posConfigId: string;
  tableId: string | null;
  items: CartItem[];
  status?: "draft" | "paid" | "archived";
  createKitchenTicket?: boolean;
  customerId?: string | null;
  paymentMethod?: "cash" | "digital" | "upi" | null;
  posSessionId?: string | null;
}

export function submitPosOrder(token: string, params: SubmitOrderParams) {
  return requestJson<{ order: Order; ticket: unknown; payment: unknown }>(
    "/pos-terminal/order",
    {
      method: "POST",
      token,
      body: params,
    }
  );
}

// Pay an existing draft order by ID — updates status + writes payment record
export function payOrder(
  token: string,
  orderId: string,
  paymentMethod: "cash" | "digital" | "upi",
  customerId?: string | null
): Promise<{ order: Order; payment: unknown }> {
  return requestJson<{ order: Order; payment: unknown }>(
    `/orders/${orderId}/pay`,
    { method: "PATCH", token, body: { paymentMethod, customerId: customerId ?? null } }
  );
}

// Pay by finding the most recent draft for this table (avoids stale UUID problem)
export function payDraftOrder(
  token: string,
  posConfigId: string,
  posSessionId: string,
  tableId: string | null,
  paymentMethod: "cash" | "digital" | "upi",
  customerId?: string | null
): Promise<{ order: Order; payment: unknown }> {
  return requestJson<{ order: Order; payment: unknown }>(
    `/orders/pay-draft`,
    { method: "PATCH", token, body: { posConfigId, posSessionId, tableId, paymentMethod, customerId: customerId ?? null } }
  );
}


