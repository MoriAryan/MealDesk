import { requestJson } from "./client";
import type { Customer } from "./types";

export async function listCustomers(accessToken: string): Promise<{ customers: Customer[] }> {
  return requestJson("/customers", { token: accessToken });
}

export async function createCustomer(
  accessToken: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
  }
): Promise<{ customer: Customer }> {
  return requestJson("/customers", {
    method: "POST",
    token: accessToken,
    body: data,
  });
}
