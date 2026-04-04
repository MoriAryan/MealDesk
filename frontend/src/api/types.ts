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
};

export type ProductVariant = {
  id?: string;
  product_id?: string;
  attribute_name: string;
  value: string;
  unit: "unit" | "kg" | "liter" | "gram" | "ml";
  extra_price: number;
};
