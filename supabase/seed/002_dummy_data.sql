-- Seed extra dummy data for Odoo POS Cafe

with cfg as (
  select id from pos_config where name = 'Odoo Cafe' limit 1
)
insert into categories (pos_config_id, name, color)
select id, 'Pizza', '#E24B4A' from cfg where not exists (select 1 from categories where name = 'Pizza')
union all select id, 'Pasta', '#EF9F27' from cfg where not exists (select 1 from categories where name = 'Pasta')
union all select id, 'Salads', '#1D9E75' from cfg where not exists (select 1 from categories where name = 'Salads')
union all select id, 'Soups', '#378ADD' from cfg where not exists (select 1 from categories where name = 'Soups')
union all select id, 'Sandwiches', '#EF9F27' from cfg where not exists (select 1 from categories where name = 'Sandwiches')
union all select id, 'Wraps', '#1D9E75' from cfg where not exists (select 1 from categories where name = 'Wraps')
union all select id, 'Tacos', '#D85A30' from cfg where not exists (select 1 from categories where name = 'Tacos')
union all select id, 'Sushi', '#D4537E' from cfg where not exists (select 1 from categories where name = 'Sushi')
union all select id, 'Steaks', '#888780' from cfg where not exists (select 1 from categories where name = 'Steaks')
union all select id, 'Seafood', '#378ADD' from cfg where not exists (select 1 from categories where name = 'Seafood')
union all select id, 'Noodles', '#D85A30' from cfg where not exists (select 1 from categories where name = 'Noodles')
union all select id, 'Rice Bowls', '#639922' from cfg where not exists (select 1 from categories where name = 'Rice Bowls')
union all select id, 'Smoothies', '#7F77DD' from cfg where not exists (select 1 from categories where name = 'Smoothies')
union all select id, 'Milkshakes', '#D4537E' from cfg where not exists (select 1 from categories where name = 'Milkshakes')
union all select id, 'Pastries', '#EF9F27' from cfg where not exists (select 1 from categories where name = 'Pastries')
union all select id, 'Cakes', '#E24B4A' from cfg where not exists (select 1 from categories where name = 'Cakes')
union all select id, 'Ice Creams', '#7F77DD' from cfg where not exists (select 1 from categories where name = 'Ice Creams');

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
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Margherita Pizza', 'Classic cheese pizza', 300, 'unit'::unit_of_measure, true
from cat where cat.name = 'Pizza' and not exists (select 1 from products where name = 'Margherita Pizza')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Pepperoni Pizza', 'Spicy pepperoni pizza', 400, 'unit'::unit_of_measure, true
from cat where cat.name = 'Pizza' and not exists (select 1 from products where name = 'Pepperoni Pizza')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Arrabiata Pasta', 'Spicy red sauce pasta', 250, 'unit'::unit_of_measure, true
from cat where cat.name = 'Pasta' and not exists (select 1 from products where name = 'Arrabiata Pasta')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Alfredo Pasta', 'Creamy white sauce pasta', 280, 'unit'::unit_of_measure, true
from cat where cat.name = 'Pasta' and not exists (select 1 from products where name = 'Alfredo Pasta')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Caesar Salad', 'Fresh lettuce with dressing', 200, 'unit'::unit_of_measure, true
from cat where cat.name = 'Salads' and not exists (select 1 from products where name = 'Caesar Salad')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Tomato Soup', 'Hot classic tomato soup', 120, 'unit'::unit_of_measure, true
from cat where cat.name = 'Soups' and not exists (select 1 from products where name = 'Tomato Soup')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Club Sandwich', 'Multi-layered veg sandwich', 180, 'unit'::unit_of_measure, true
from cat where cat.name = 'Sandwiches' and not exists (select 1 from products where name = 'Club Sandwich')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Falafel Wrap', 'Wrapped falafel with hummus', 190, 'unit'::unit_of_measure, true
from cat where cat.name = 'Wraps' and not exists (select 1 from products where name = 'Falafel Wrap')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Spicy Tacos', 'Mexican style hard shell tacos', 220, 'unit'::unit_of_measure, true
from cat where cat.name = 'Tacos' and not exists (select 1 from products where name = 'Spicy Tacos')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'California Roll', 'Sushi with avocados', 450, 'unit'::unit_of_measure, true
from cat where cat.name = 'Sushi' and not exists (select 1 from products where name = 'California Roll')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Ribeye Steak', 'Premium grilled steak', 1200, 'unit'::unit_of_measure, true
from cat where cat.name = 'Steaks' and not exists (select 1 from products where name = 'Ribeye Steak')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Grilled Salmon', 'Fresh salmon catch', 900, 'unit'::unit_of_measure, true
from cat where cat.name = 'Seafood' and not exists (select 1 from products where name = 'Grilled Salmon')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Hakka Noodles', 'Wok tossed noodles', 250, 'unit'::unit_of_measure, true
from cat where cat.name = 'Noodles' and not exists (select 1 from products where name = 'Hakka Noodles')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Teriyaki Bowl', 'Rice bowl with teriyaki sauce', 350, 'unit'::unit_of_measure, true
from cat where cat.name = 'Rice Bowls' and not exists (select 1 from products where name = 'Teriyaki Bowl')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '18%' limit 1), 'Berry Smoothie', 'Mixed berry health smoothie', 200, 'unit'::unit_of_measure, true
from cat where cat.name = 'Smoothies' and not exists (select 1 from products where name = 'Berry Smoothie')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '18%' limit 1), 'Oreo Milkshake', 'Thick creamy oreo shake', 180, 'unit'::unit_of_measure, true
from cat where cat.name = 'Milkshakes' and not exists (select 1 from products where name = 'Oreo Milkshake')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Croissant', 'Butter baked croissant', 100, 'unit'::unit_of_measure, true
from cat where cat.name = 'Pastries' and not exists (select 1 from products where name = 'Croissant')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Chocolate Truffle', 'Rich chocolate cake slice', 220, 'unit'::unit_of_measure, true
from cat where cat.name = 'Cakes' and not exists (select 1 from products where name = 'Chocolate Truffle')
union all
select cat.pos_config_id, cat.category_id, (select id from tax where label = '5%' limit 1), 'Vanilla Scoop', 'Classic vanilla ice cream', 120, 'unit'::unit_of_measure, true
from cat where cat.name = 'Ice Creams' and not exists (select 1 from products where name = 'Vanilla Scoop');
