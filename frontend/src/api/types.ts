export type PosConfig = {
  id: string;
  name: string;
  cash_enabled: boolean;
  digital_enabled: boolean;
  upi_enabled: boolean;
  upi_id: string | null;
  self_ordering_enabled: boolean;
  self_ordering_mode: "qr" | "token" | null;
  bg_color: string | null;
  pos_sessions?: {
    opened_at: string;
    closing_sale_total: number;
    status: "active" | "closed";
  }[];
};

export type Category = {
  id: string;
  pos_config_id: string;
  name: string;
  color: string;
};

export type PaymentMethod = {
  id: string;
  pos_config_id: string;
  method: "cash" | "digital" | "upi";
  enabled: boolean;
  upi_id: string | null;
};

export type TaxRate = {
  id: string;
  label: string;
  rate: number;
};

export type Product = {
  id: string;
  pos_config_id: string;
  category_id: string;
  tax_rate_id: string;
  name: string;
  description: string | null;
  price: number;
  uom: "unit" | "kg" | "liter" | "gram" | "ml";
  active: boolean;
  categories?: { name: string; color: string } | null;
  tax_rates?: { label: string; rate: number } | null;
  product_variants?: ProductVariant[];
};

export type ProductVariant = {
  id?: string;
  product_id?: string;
  attribute_name: string;
  value: string;
  unit: "unit" | "kg" | "liter" | "gram" | "ml";
  extra_price: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  total_sales?: number;
};

export type OrderLine = {
  id: string;
  order_id?: string;
  product_name: string;
  qty: number;
  unit_price: number;
  tax_rate: number;
  uom: string;
  discount: number;
  subtotal: number;
  total: number;
  notes: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  pos_session_id: string | null;
  pos_config_id: string;
  table_id: string | null;
  customer_id: string | null;
  status: "draft" | "paid" | "archived";
  notes: string | null;
  source: "pos" | "mobile";
  self_order_token: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  is_invoice: boolean;
  created_at: string;
  updated_at: string;
  customers?: { name: string } | null;
  pos_sessions?: { id: string; opened_at: string } | null;
  order_lines?: OrderLine[];
};

export type Payment = {
  id: string;
  order_id: string;
  payment_method: "cash" | "digital" | "upi";
  amount: number;
  paid_at: string;
  created_at: string;
  orders?: { order_number: string } | null;
};
