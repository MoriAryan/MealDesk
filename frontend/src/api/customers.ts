import { requestJson } from "./client";
import type { Customer } from "./types";

export async function listCustomers(accessToken: string): Promise<{ customers: Customer[] }> {
  return requestJson("/customers", { token: accessToken });
}
