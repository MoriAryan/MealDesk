-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pos_config_id uuid NOT NULL,
  name character varying NOT NULL,
  color character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_pos_config_id_fkey FOREIGN KEY (pos_config_id) REFERENCES public.pos_config(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  email character varying,
  phone character varying,
  street1 character varying,
  street2 character varying,
  city character varying,
  state character varying,
  country character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.floors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pos_config_id uuid NOT NULL,
  name character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT floors_pkey PRIMARY KEY (id),
  CONSTRAINT floors_pos_config_id_fkey FOREIGN KEY (pos_config_id) REFERENCES public.pos_config(id)
);
CREATE TABLE public.kitchen_ticket_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kitchen_ticket_id uuid NOT NULL,
  order_line_id uuid NOT NULL,
  product_name character varying NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  prepared boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT kitchen_ticket_items_pkey PRIMARY KEY (id),
  CONSTRAINT kitchen_ticket_items_kitchen_ticket_id_fkey FOREIGN KEY (kitchen_ticket_id) REFERENCES public.kitchen_tickets(id),
  CONSTRAINT kitchen_ticket_items_order_line_id_fkey FOREIGN KEY (order_line_id) REFERENCES public.order_lines(id)
);
CREATE TABLE public.kitchen_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  order_number character varying NOT NULL,
  pos_config_id uuid NOT NULL,
  stage USER-DEFINED NOT NULL DEFAULT 'to_cook'::kitchen_stage,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT kitchen_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT kitchen_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT kitchen_tickets_pos_config_id_fkey FOREIGN KEY (pos_config_id) REFERENCES public.pos_config(id)
);
CREATE TABLE public.order_line_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_line_id uuid NOT NULL,
  variant_id uuid,
  attribute_name character varying NOT NULL,
  value character varying NOT NULL,
  extra_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_line_variants_pkey PRIMARY KEY (id),
  CONSTRAINT order_line_variants_order_line_id_fkey FOREIGN KEY (order_line_id) REFERENCES public.order_lines(id),
  CONSTRAINT order_line_variants_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.order_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name character varying NOT NULL,
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  tax_rate numeric NOT NULL CHECK (tax_rate >= 0::numeric),
  uom character varying NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  discount numeric NOT NULL DEFAULT 0,
  notes text,
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_lines_pkey PRIMARY KEY (id),
  CONSTRAINT order_lines_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number character varying NOT NULL UNIQUE,
  pos_session_id uuid,
  pos_config_id uuid NOT NULL,
  table_id uuid,
  customer_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::order_status,
  notes text,
  source USER-DEFINED NOT NULL DEFAULT 'pos'::order_source,
  self_order_token character varying,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_total numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  is_invoice boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_pos_session_id_fkey FOREIGN KEY (pos_session_id) REFERENCES public.pos_sessions(id),
  CONSTRAINT orders_pos_config_id_fkey FOREIGN KEY (pos_config_id) REFERENCES public.pos_config(id),
  CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pos_config_id uuid NOT NULL,
  method USER-DEFINED NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  upi_id character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_pos_config_id_fkey FOREIGN KEY (pos_config_id) REFERENCES public.pos_config(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  payment_method USER-DEFINED NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.pos_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  cash_enabled boolean NOT NULL DEFAULT false,
  digital_enabled boolean NOT NULL DEFAULT false,
  upi_enabled boolean NOT NULL DEFAULT false,
  upi_id character varying,
  self_ordering_enabled boolean NOT NULL DEFAULT false,
  self_ordering_mode USER-DEFINED,
  bg_color character varying,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pos_config_pkey PRIMARY KEY (id),
  CONSTRAINT pos_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.pos_config_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pos_config_id uuid NOT NULL,
  storage_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pos_config_images_pkey PRIMARY KEY (id),
  CONSTRAINT pos_config_images_pos_config_id_fkey FOREIGN KEY (pos_config_id) REFERENCES public.pos_config(id)
);
CREATE TABLE public.pos_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pos_config_id uuid NOT NULL,
  opened_by uuid NOT NULL,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  closing_sale_total numeric NOT NULL DEFAULT 0,
  status USER-DEFINED NOT NULL DEFAULT 'active'::session_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pos_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT pos_sessions_pos_config_id_fkey FOREIGN KEY (pos_config_id) REFERENCES public.pos_config(id),
  CONSTRAINT pos_sessions_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES public.users(id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  attribute_name character varying NOT NULL,
  value character varying NOT NULL,
  unit USER-DEFINED,
  extra_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pos_config_id uuid NOT NULL,
  category_id uuid NOT NULL,
  tax_rate_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  uom USER-DEFINED NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_pos_config_id_fkey FOREIGN KEY (pos_config_id) REFERENCES public.pos_config(id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT products_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id)
);
CREATE TABLE public.refresh_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  label character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.self_order_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL UNIQUE,
  pos_config_id uuid NOT NULL,
  token character varying NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT self_order_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT self_order_tokens_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id),
  CONSTRAINT self_order_tokens_pos_config_id_fkey FOREIGN KEY (pos_config_id) REFERENCES public.pos_config(id)
);
CREATE TABLE public.tables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  floor_id uuid NOT NULL,
  table_number character varying NOT NULL,
  seats integer NOT NULL CHECK (seats > 0),
  active boolean NOT NULL DEFAULT true,
  appointment_resource character varying,
  qr_token character varying NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tables_pkey PRIMARY KEY (id),
  CONSTRAINT tables_floor_id_fkey FOREIGN KEY (floor_id) REFERENCES public.floors(id)
);
CREATE TABLE public.tax_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  label character varying NOT NULL UNIQUE,
  rate numeric NOT NULL CHECK (rate >= 0::numeric AND rate <= 100::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tax_rates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);