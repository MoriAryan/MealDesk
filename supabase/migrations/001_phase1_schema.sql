-- Odoo POS Cafe
-- Phase 1 foundational schema

create extension if not exists "pgcrypto";

create type self_ordering_mode as enum ('online', 'qr_menu');
create type session_status as enum ('active', 'closed');
create type order_status as enum ('draft', 'paid', 'archived');
create type order_source as enum ('pos', 'mobile');
create type kitchen_stage as enum ('to_cook', 'preparing', 'completed');
create type payment_method_type as enum ('cash', 'digital', 'upi');
create type unit_of_measure as enum ('kg', 'unit', 'liter');

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  code varchar(32) not null unique,
  label varchar(64) not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id),
  name varchar(120) not null,
  email varchar(160) not null unique,
  password_hash varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists pos_config (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  cash_enabled boolean not null default false,
  digital_enabled boolean not null default false,
  upi_enabled boolean not null default false,
  upi_id varchar(80),
  self_ordering_enabled boolean not null default false,
  self_ordering_mode self_ordering_mode,
  bg_color varchar(16),
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((upi_enabled = false) or (upi_id is not null and position('@' in upi_id) > 1))
);

create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  pos_config_id uuid not null references pos_config(id) on delete cascade,
  method payment_method_type not null,
  enabled boolean not null default true,
  upi_id varchar(80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pos_config_id, method),
  check ((method <> 'upi') or (upi_id is not null and position('@' in upi_id) > 1))
);

create table if not exists pos_config_images (
  id uuid primary key default gen_random_uuid(),
  pos_config_id uuid not null references pos_config(id) on delete cascade,
  storage_url text not null,
  display_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists pos_sessions (
  id uuid primary key default gen_random_uuid(),
  pos_config_id uuid not null references pos_config(id) on delete cascade,
  opened_by uuid not null references users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closing_sale_total numeric(10,2) not null default 0,
  status session_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_pos_session_single_active
on pos_sessions(pos_config_id)
where status = 'active';

create table if not exists floors (
  id uuid primary key default gen_random_uuid(),
  pos_config_id uuid not null references pos_config(id) on delete cascade,
  name varchar(120) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pos_config_id, name)
);

create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floors(id) on delete cascade,
  table_number varchar(24) not null,
  seats integer not null check (seats > 0),
  active boolean not null default true,
  appointment_resource varchar(150),
  qr_token varchar(40) not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (floor_id, table_number)
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  pos_config_id uuid not null references pos_config(id) on delete cascade,
  name varchar(120) not null,
  color varchar(16) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pos_config_id, name)
);

create table if not exists tax_rates (
  id uuid primary key default gen_random_uuid(),
  label varchar(16) not null unique,
  rate numeric(5,2) not null check (rate >= 0 and rate <= 100),
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  pos_config_id uuid not null references pos_config(id) on delete cascade,
  category_id uuid not null references categories(id),
  tax_rate_id uuid not null references tax_rates(id),
  name varchar(160) not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  uom unit_of_measure not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  attribute_name varchar(80) not null,
  value varchar(80) not null,
  unit unit_of_measure,
  extra_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  email varchar(160),
  phone varchar(32),
  street1 varchar(160),
  street2 varchar(160),
  city varchar(80),
  state varchar(80),
  country varchar(80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number varchar(32) not null unique,
  pos_session_id uuid references pos_sessions(id),
  pos_config_id uuid not null references pos_config(id),
  table_id uuid references tables(id),
  customer_id uuid references customers(id),
  status order_status not null default 'draft',
  notes text,
  source order_source not null default 'pos',
  self_order_token varchar(40),
  subtotal numeric(10,2) not null default 0,
  tax_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  is_invoice boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name varchar(160) not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  tax_rate numeric(5,2) not null check (tax_rate >= 0),
  uom varchar(24) not null,
  qty integer not null check (qty > 0),
  discount numeric(5,2) not null default 0,
  notes text,
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_line_variants (
  id uuid primary key default gen_random_uuid(),
  order_line_id uuid not null references order_lines(id) on delete cascade,
  variant_id uuid references product_variants(id),
  attribute_name varchar(80) not null,
  value varchar(80) not null,
  extra_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  payment_method payment_method_type not null,
  amount numeric(10,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists kitchen_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  order_number varchar(32) not null,
  pos_config_id uuid not null references pos_config(id) on delete cascade,
  stage kitchen_stage not null default 'to_cook',
  sent_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kitchen_ticket_items (
  id uuid primary key default gen_random_uuid(),
  kitchen_ticket_id uuid not null references kitchen_tickets(id) on delete cascade,
  order_line_id uuid not null references order_lines(id) on delete cascade,
  product_name varchar(160) not null,
  qty integer not null check (qty > 0),
  prepared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists self_order_tokens (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null unique references tables(id) on delete cascade,
  pos_config_id uuid not null references pos_config(id) on delete cascade,
  token varchar(40) not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_pos_config_updated_at on pos_config;
create trigger trg_pos_config_updated_at
before update on pos_config
for each row execute function set_updated_at();

drop trigger if exists trg_payment_methods_updated_at on payment_methods;
create trigger trg_payment_methods_updated_at
before update on payment_methods
for each row execute function set_updated_at();

drop trigger if exists trg_pos_sessions_updated_at on pos_sessions;
create trigger trg_pos_sessions_updated_at
before update on pos_sessions
for each row execute function set_updated_at();

drop trigger if exists trg_floors_updated_at on floors;
create trigger trg_floors_updated_at
before update on floors
for each row execute function set_updated_at();

drop trigger if exists trg_tables_updated_at on tables;
create trigger trg_tables_updated_at
before update on tables
for each row execute function set_updated_at();

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
before update on categories
for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
before update on products
for each row execute function set_updated_at();

drop trigger if exists trg_product_variants_updated_at on product_variants;
create trigger trg_product_variants_updated_at
before update on product_variants
for each row execute function set_updated_at();

drop trigger if exists trg_customers_updated_at on customers;
create trigger trg_customers_updated_at
before update on customers
for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
before update on orders
for each row execute function set_updated_at();

drop trigger if exists trg_order_lines_updated_at on order_lines;
create trigger trg_order_lines_updated_at
before update on order_lines
for each row execute function set_updated_at();

drop trigger if exists trg_kitchen_tickets_updated_at on kitchen_tickets;
create trigger trg_kitchen_tickets_updated_at
before update on kitchen_tickets
for each row execute function set_updated_at();

drop trigger if exists trg_kitchen_ticket_items_updated_at on kitchen_ticket_items;
create trigger trg_kitchen_ticket_items_updated_at
before update on kitchen_ticket_items
for each row execute function set_updated_at();

drop trigger if exists trg_self_order_tokens_updated_at on self_order_tokens;
create trigger trg_self_order_tokens_updated_at
before update on self_order_tokens
for each row execute function set_updated_at();
