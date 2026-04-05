import { supabaseAdmin } from "../src/config/supabase.js";
async function test() {
  try {
    const from = "2020-01-01";
    const to = "2030-01-01";
    
    let query = supabaseAdmin
      .from("orders")
      .select("id, total, subtotal, tax_total, status, source, created_at, pos_config_id")
      .eq("status", "paid")
      .gte("created_at", from)
      .lte("created_at", to);

    const { data: orders, error } = await query;
    if (error) throw error;
    console.log(`Found ${orders.length} orders.`);

    let lines = [];
    const chunkSize = 25;
    const orderIds = orders.map(o => o.id);
    console.log(`Order IDs: ${orderIds.length}`);
    
    for (let i = 0; i < orderIds.length; i += chunkSize) {
      const chunk = orderIds.slice(i, i + chunkSize);
      const { data: chunkLines, error: chunkErr } = await supabaseAdmin
        .from("order_lines")
        .select("product_name, qty, subtotal, product_id, products(category_id, categories(name, color))")
        .in("order_id", chunk);

      if (chunkErr) throw chunkErr;
      if (chunkLines) lines.push(...chunkLines);
    }
    console.log(`Found ${lines.length} lines. SUCCESS.`);
  } catch (err) {
    console.error("FAILED:", err.message, err);
  }
}
test();
