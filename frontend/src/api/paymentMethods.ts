import { requestJson } from "./client";
import type { PaymentMethod } from "./types";

export function listPaymentMethods(token: string, posConfigId?: string) {
  const query = posConfigId ? `?pos_config_id=${encodeURIComponent(posConfigId)}` : "";
  return requestJson<{ paymentMethods: PaymentMethod[] }>(`/payment-methods${query}`, { token });
}

export function savePaymentMethod(
  token: string,
  payload: {
    posConfigId: string;
    method: "cash" | "digital" | "upi";
    enabled?: boolean;
    upiId?: string;
  }
) {
  return requestJson<{ paymentMethod: PaymentMethod }>("/payment-methods", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updatePaymentMethod(
  token: string,
  id: string,
  payload: { enabled?: boolean; upiId?: string }
) {
  return requestJson<{ paymentMethod: PaymentMethod }>(`/payment-methods/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deletePaymentMethod(token: string, id: string) {
  return requestJson<void>(`/payment-methods/${id}`, {
    method: "DELETE",
    token,
  });
}
