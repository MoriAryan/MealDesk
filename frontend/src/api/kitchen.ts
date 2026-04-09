import { requestJson } from "./client";

export interface KitchenTicketItem {
  id: string;
  kitchen_ticket_id: string;
  order_line_id: string;
  product_name: string;
  qty: number;
  prepared: boolean;
  order_lines?: {
    products?: {
      categories?: {
        name: string;
      };
    };
  };
}

export interface KitchenTicket {
  id: string;
  order_id: string;
  order_number: string;
  pos_config_id: string;
  stage: "to_cook" | "preparing" | "completed";
  sent_at: string;
  updated_at: string;
  kitchen_ticket_items: KitchenTicketItem[];
}

interface FetchTicketsResponse {
  tickets: KitchenTicket[];
}

export function fetchKitchenTickets(token: string, posConfigId?: string) {
  const query = posConfigId ? `?pos_config_id=${posConfigId}` : "";
  return requestJson<FetchTicketsResponse>(`/kitchen${query}`, { token });
}

export function updateTicketStage(token: string, id: string, stage: "to_cook" | "preparing" | "completed") {
  return requestJson<{ ticket: KitchenTicket }>(`/kitchen/${id}/stage`, {
    method: "PUT",
    token,
    body: { stage },
  });
}

export function updateItemPrepared(token: string, ticketId: string, itemId: string, prepared: boolean) {
  return requestJson<{ item: KitchenTicketItem }>(`/kitchen/${ticketId}/items/${itemId}/prepared`, {
    method: "PUT",
    token,
    body: { prepared },
  });
}

