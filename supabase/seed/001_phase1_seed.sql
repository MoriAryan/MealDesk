-- Odoo POS Cafe
-- Phase 1 seed data

insert into roles (code, label)
values
  ('admin', 'Admin'),
  ('cashier', 'Cashier'),
  ('kitchen', 'Kitchen Staff')
on conflict (code) do update set label = excluded.label;

insert into tax_rates (label, rate)
values
  ('5%', 5.00),
  ('18%', 18.00),
  ('28%', 28.00)
on conflict (label) do nothing;

with admin_role as (
  select id from roles where code = 'admin' limit 1
), seeded_user as (
  insert into users (role_id, name, email, password_hash)
  select id, 'Admin User', 'admin@odooposcafe.local', '$2b$10$kM3TVn6A9c3V5OG8yNfFael9iVnHchM5xK9xtE2bJ8Bnb9fzkP8CW'
  from admin_role
  where not exists (select 1 from users where email = 'admin@odooposcafe.local')
  returning id
), fallback_user as (
  select id from seeded_user
  union all
  select id from users where email = 'admin@odooposcafe.local' limit 1
), seeded_config as (
  insert into pos_config (
    name,
    cash_enabled,
    digital_enabled,
    upi_enabled,
    upi_id,
    self_ordering_enabled,
    self_ordering_mode,
    bg_color,
    created_by
  )
  select
    'Odoo Cafe',
    true,
    true,
    true,
    '123@ybl.com',
    false,
    null,
    '#FFF4E6',
    id
  from fallback_user
  where not exists (select 1 from pos_config where name = 'Odoo Cafe')
  returning id
), fallback_config as (
  select id from seeded_config
  union all
  select id from pos_config where name = 'Odoo Cafe' limit 1
)
insert into payment_methods (pos_config_id, method, enabled, upi_id)
select id, 'cash'::payment_method_type, true, null from fallback_config
union all
select id, 'digital'::payment_method_type, true, null from fallback_config
union all
select id, 'upi'::payment_method_type, true, '123@ybl.com' from fallback_config
on conflict (pos_config_id, method) do update
set enabled = excluded.enabled,
    upi_id = excluded.upi_id;

with cfg as (
  select id from pos_config where name = 'Odoo Cafe' limit 1
), floor_seed as (
  insert into floors (pos_config_id, name)
  select id, 'Ground Floor' from cfg
  where not exists (select 1 from floors where name = 'Ground Floor')
  returning id
), floor_ref as (
  select id from floor_seed
  union all
  select id from floors where name = 'Ground Floor' limit 1
), table_seed as (
  insert into tables (floor_id, table_number, seats, active, qr_token)
  select id, '1', 4, true, 'tb1abc' from floor_ref
  where not exists (select 1 from tables where qr_token = 'tb1abc')
  union all
  select id, '2', 4, true, 'tb2abc' from floor_ref
  where not exists (select 1 from tables where qr_token = 'tb2abc')
  returning id
), table_ref as (
  select t.id as table_id, f.pos_config_id
  from tables t
  join floors f on f.id = t.floor_id
  where t.qr_token in ('tb1abc', 'tb2abc')
)
insert into self_order_tokens (table_id, pos_config_id, token, active)
select table_id, pos_config_id, 'self_' || substr(table_id::text, 1, 6), true
from table_ref
on conflict (table_id) do nothing;

with cfg as (
  select id from pos_config where name = 'Odoo Cafe' limit 1
)
insert into categories (pos_config_id, name, color)
select id, 'Quick Bites', '#378ADD' from cfg
where not exists (select 1 from categories where name = 'Quick Bites')
union all
select id, 'Drinks', '#1D9E75' from cfg
where not exists (select 1 from categories where name = 'Drinks')
union all
select id, 'Dessert', '#D85A30' from cfg
where not exists (select 1 from categories where name = 'Dessert');

with cfg as (
  select id as pos_config_id from pos_config where name = 'Odoo Cafe' limit 1
), cat as (
  select c.id as category_id, c.name, c.pos_config_id
  from categories c
  join cfg on cfg.pos_config_id = c.pos_config_id
), tax as (
  select id, label from tax_rates
)
insert into products (pos_config_id, category_id, tax_rate_id, name, description, price, uom, active)
select cat.pos_config_id, cat.category_id, tax.id, 'Veg Burger', 'Classic burger', 120, 'unit'::unit_of_measure, true
from cat join tax on tax.label = '5%'
where cat.name = 'Quick Bites'
  and not exists (select 1 from products where name = 'Veg Burger')
union all
select cat.pos_config_id, cat.category_id, tax.id, 'Cold Coffee', 'Chilled coffee drink', 90, 'unit', true
from cat join tax on tax.label = '18%'
where cat.name = 'Drinks'
  and not exists (select 1 from products where name = 'Cold Coffee');
