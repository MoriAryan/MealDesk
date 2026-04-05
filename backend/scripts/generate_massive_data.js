import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper for fast wipes
async function wipeTable(tableName) {
  console.log(`Wiping ${tableName}...`);
  const { error } = await supabase.from(tableName).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) console.warn(`Note on ${tableName}: ${error.message}`);
}

async function run() {
  console.log("🚀 Starting Massive Dataset Injection...");

  // 1. WIPE DATA (Bottom to Top to respect Foreign Keys)
  await wipeTable("payments");
  await wipeTable("kitchen_ticket_items");
  await wipeTable("kitchen_tickets");
  await wipeTable("order_lines");
  await wipeTable("orders");
  await wipeTable("pos_sessions");
  await wipeTable("customers");
  await wipeTable("product_variants");
  await wipeTable("products");
  await wipeTable("categories");
  await wipeTable("tax_rates");
  await wipeTable("payment_methods");
  await wipeTable("pos_config");
  await wipeTable("refresh_tokens");
  await wipeTable("users");

  // 2. SETUP ROLES & USERS
  const { data: roles } = await supabase.from("roles").select("*");
  const adminRole = roles.find((r) => r.code === "admin");
  const cashierRole = roles.find((r) => r.code === "cashier");

  const pwHash = await bcrypt.hash("admin123", 10);
  
  const { data: adminUser } = await supabase.from("users").insert({
    role_id: adminRole.id,
    name: "System Admin",
    email: "admin@gmail.com",
    password_hash: pwHash,
  }).select().single();

  const { data: cashierUser } = await supabase.from("users").insert({
    role_id: cashierRole.id,
    name: "Cafe Cashier",
    email: "cashier@gmail.com",
    password_hash: pwHash,
  }).select().single();

  console.log("✅ Users generated.");

  // 3. TAX RATES
  const taxRatesData = [
    { label: "Zero Tax", rate: 0 },
    { label: "GST 5%", rate: 5 },
    { label: "GST 18%", rate: 18 },
  ];
  const { data: taxes } = await supabase.from("tax_rates").insert(taxRatesData).select();
  const tax0 = taxes.find(t => t.rate === 0).id;
  const tax5 = taxes.find(t => t.rate === 5).id;
  
  console.log("✅ Tax rates generated.");

  // 4. POS CONFIGS & PAYMENT METHODS
  const { data: posConfigs } = await supabase.from("pos_config").insert([
    { name: "Main Counter POS", created_by: adminUser.id },
    { name: "Drive-Thru POS", created_by: adminUser.id },
  ]).select();

  const mainConfigId = posConfigs[0].id;
  
  await supabase.from("payment_methods").insert([
    { pos_config_id: mainConfigId, method: "cash", enabled: true },
    { pos_config_id: mainConfigId, method: "digital", enabled: true },
    { pos_config_id: mainConfigId, method: "upi", enabled: true, upi_id: "cafe@ybl" },
  ]);

  console.log("✅ POS Terminals generated.");

  // 5. CATEGORIES
  const cats = [
    { name: "Espresso Bar", color: "#6F4E37" },
    { name: "Iced Coffees", color: "#8E725E" },
    { name: "Artisan Teas", color: "#4CAF50" },
    { name: "Fresh Pastries", color: "#F4A460" },
    { name: "Hot Kitchen", color: "#E57373" },
    { name: "Smoothies", color: "#BA68C8" },
  ];
  const { data: categories } = await supabase.from("categories").insert(
    cats.map(c => ({ pos_config_id: mainConfigId, name: c.name, color: c.color }))
  ).select();

  const catMap = {};
  categories.forEach(c => (catMap[c.name] = c.id));

  // 6. PRODUCTS & VARIANTS
  const prodDefs = [
    { cat: "Espresso Bar", name: "Classic Espresso", price: 3.5, uom: "unit", tax: tax5 },
    { cat: "Espresso Bar", name: "Cappuccino", price: 4.5, uom: "unit", tax: tax5 },
    { cat: "Espresso Bar", name: "Latte Macchiato", price: 5.0, uom: "unit", tax: tax5 },
    { cat: "Iced Coffees", name: "Cold Brew", price: 5.5, uom: "unit", tax: tax5 },
    { cat: "Iced Coffees", name: "Iced Caramel Macchiato", price: 6.0, uom: "unit", tax: tax5 },
    { cat: "Artisan Teas", name: "Matcha Green Tea", price: 4.8, uom: "unit", tax: tax5 },
    { cat: "Artisan Teas", name: "Chamomile Blend", price: 4.0, uom: "unit", tax: tax0 },
    { cat: "Fresh Pastries", name: "Almond Croissant", price: 3.8, uom: "unit", tax: tax5 },
    { cat: "Fresh Pastries", name: "Blueberry Muffin", price: 3.5, uom: "unit", tax: tax5 },
    { cat: "Fresh Pastries", name: "Sourdough Toast", price: 4.5, uom: "unit", tax: tax5 },
    { cat: "Hot Kitchen", name: "Avocado Smash", price: 9.5, uom: "unit", tax: tax5 },
    { cat: "Hot Kitchen", name: "Truffle Fries", price: 6.5, uom: "unit", tax: tax5 },
    { cat: "Hot Kitchen", name: "Breakfast Sandwich", price: 8.0, uom: "unit", tax: tax5 },
    { cat: "Smoothies", name: "Berry Blast", price: 7.0, uom: "unit", tax: tax5 },
    { cat: "Smoothies", name: "Green Detox", price: 7.5, uom: "unit", tax: tax5 },
  ];

  const dbProducts = [];
  for (const p of prodDefs) {
    const { data: prod } = await supabase.from("products").insert({
      pos_config_id: mainConfigId,
      category_id: catMap[p.cat],
      tax_rate_id: p.tax,
      name: p.name,
      price: p.price,
      uom: p.uom,
      active: true,
    }).select().single();
    dbProducts.push(prod);
  }

  console.log("✅ Catalog generated.");

  // 7. CUSTOMERS
  const custNames = ["Alice Smith", "Bob Johnson", "Charlie Davis", "Diana Prince", "Evan Wright", "Fiona Adams", "George Baker", "Hannah Clark"];
  const { data: dbCustomers } = await supabase.from("customers").insert(
    custNames.map(name => ({ name, email: name.split(" ")[0].toLowerCase() + "@example.com" }))
  ).select();

  console.log("✅ Customers generated.");

  // 8. MASSIVE ORDERS ALGORITHM (90 DAYS)
  console.log("⏳ Generating 90 days of historical sales data... This will take a moment.");
  
  const TOTAL_ORDERS = 1200; // Large but safely runs inside timeout
  const DAY_SPREAD = 90;
  let ordersToInsert = [];
  let linesToInsert = [];
  let paymentsToInsert = [];

  for (let i = 0; i < TOTAL_ORDERS; i++) {
    // Generate date between now and 90 days ago, skewing slightly towards recent
    const daysAgo = Math.floor(Math.random() * DAY_SPREAD);
    const hour = Math.floor(Math.random() * 12) + 7; // Store hours 7am - 7pm
    const minute = Math.floor(Math.random() * 60);
    const orderDate = new Date(Date.now() - (daysAgo * 86400000));
    orderDate.setHours(hour, minute, 0, 0);

    const orderId = `11111111-1111-1111-1111-${(i).toString().padStart(12, '0')}`;
    const orderNumber = `POS-${orderDate.getTime().toString().slice(-6)}-${i}`;
    
    // Pick 1 to 4 random products
    const lineCount = Math.floor(Math.random() * 4) + 1;
    let subtotal = 0;
    let taxTotal = 0;
    
    for (let j = 0; j < lineCount; j++) {
      const p = dbProducts[Math.floor(Math.random() * dbProducts.length)];
      const qty = Math.floor(Math.random() * 2) + 1; // 1 or 2
      const taxRateObj = taxes.find(t => t.id === p.tax_rate_id);
      const rateNum = Number(taxRateObj.rate);
      const lineSub = p.price * qty;
      const lineTax = lineSub * (rateNum / 100);
      
      subtotal += lineSub;
      taxTotal += lineTax;

      linesToInsert.push({
        order_id: orderId,
        product_id: p.id,
        product_name: p.name,
        unit_price: p.price,
        tax_rate: rateNum,
        uom: p.uom,
        qty: qty,
        subtotal: lineSub,
        total: lineSub + lineTax,
        created_at: orderDate.toISOString(),
        updated_at: orderDate.toISOString()
      });
    }

    const total = subtotal + taxTotal;

    const useCust = Math.random() > 0.6;
    const custId = useCust ? dbCustomers[Math.floor(Math.random() * dbCustomers.length)].id : null;

    ordersToInsert.push({
      id: orderId,
      order_number: orderNumber,
      pos_config_id: mainConfigId,
      customer_id: custId,
      status: "paid",
      source: "pos",
      subtotal: subtotal,
      tax_total: taxTotal,
      total: total,
      is_invoice: true,
      created_at: orderDate.toISOString(),
      updated_at: orderDate.toISOString()
    });

    const methods = ["cash", "digital", "digital", "upi"]; // Weighted digital
    paymentsToInsert.push({
      order_id: orderId,
      payment_method: methods[Math.floor(Math.random() * methods.length)],
      amount: total,
      paid_at: orderDate.toISOString(),
      created_at: orderDate.toISOString()
    });
  }

  // Batch insert to bypass payload size limits
  const BATCH_SIZE = 300;
  for (let i = 0; i < ordersToInsert.length; i += BATCH_SIZE) {
    const { error: oErr } = await supabase.from("orders").insert(ordersToInsert.slice(i, i + BATCH_SIZE));
    if (oErr) console.error("Order Insert Error:", oErr.message);
  }
  for (let i = 0; i < linesToInsert.length; i += BATCH_SIZE) {
    const { error: lErr } = await supabase.from("order_lines").insert(linesToInsert.slice(i, i + BATCH_SIZE));
    if (lErr) console.error("Line Insert Error:", lErr.message);
  }
  for (let i = 0; i < paymentsToInsert.length; i += BATCH_SIZE) {
    const { error: pErr } = await supabase.from("payments").insert(paymentsToInsert.slice(i, i + BATCH_SIZE));
    if (pErr) console.error("Payment Insert Error:", pErr.message);
  }

  console.log(`✅ Supercharged Data Complete! 1200+ orders spanning perfectly over 90 days.`);
}

run().then(() => {
  console.log("Done. Exiting.");
  process.exit(0);
}).catch(console.error);
