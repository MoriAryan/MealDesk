const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/reports/summary?from=&to=&pos_config_id=
router.get("/summary", async (req, res) => {
  try {
    const { from, to, pos_config_id } = req.query;

    let query = supabaseAdmin
      .from("orders")
      .select("id, total, subtotal, tax_total, status, source, created_at, pos_config_id")
      .eq("status", "paid");

    if (from) query = query.gte("created_at", from);
    if (to)   query = query.lte("created_at", to);
    if (pos_config_id) query = query.eq("pos_config_id", pos_config_id);

    const { data: orders, error } = await query;
    if (error) throw error;

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalTax     = orders.reduce((sum, o) => sum + Number(o.tax_total), 0);
    const avgOrder     = orders.length ? totalRevenue / orders.length : 0;

    // Top products from order_lines
    const { data: lines, error: linesErr } = await supabaseAdmin
      .from("order_lines")
      .select("product_name, qty, subtotal")
      .in("order_id", orders.map(o => o.id));

    if (linesErr) throw linesErr;

    const productMap = {};
    for (const line of (lines || [])) {
      const name = line.product_name;
      if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 };
      productMap[name].qty += Number(line.qty);
      productMap[name].revenue += Number(line.subtotal);
    }

    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 10)
      .map(([name, stats]) => ({ name, ...stats }));

    res.json({
      totalOrders: orders.length,
      totalRevenue,
      totalTax,
      avgOrder,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate report" });
  }
});

module.exports = router;
