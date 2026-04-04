const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/reports/summary?from=&to=&pos_config_id=
router.get("/summary", async (req, res) => {
  try {
    const { from, to, pos_config_id } = req.query;

    // --- Current period orders ---
    let query = supabaseAdmin
      .from("orders")
      .select("id, total, subtotal, tax_total, status, source, created_at, pos_config_id")
      .eq("status", "paid");

    if (from) query = query.gte("created_at", from);
    if (to)   query = query.lte("created_at", to);
    if (pos_config_id) query = query.eq("pos_config_id", pos_config_id);

    const { data: orders, error } = await query;
    if (error) throw error;

    // --- Previous period orders (for % change) ---
    let prevOrders = [];
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const periodMs = toDate.getTime() - fromDate.getTime();
      const prevFrom = new Date(fromDate.getTime() - periodMs).toISOString();
      const prevTo = new Date(fromDate.getTime()).toISOString();

      let prevQuery = supabaseAdmin
        .from("orders")
        .select("id, total, subtotal, tax_total")
        .eq("status", "paid")
        .gte("created_at", prevFrom)
        .lte("created_at", prevTo);
      if (pos_config_id) prevQuery = prevQuery.eq("pos_config_id", pos_config_id);
      const { data: prev } = await prevQuery;
      prevOrders = prev || [];
    }

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalTax     = orders.reduce((sum, o) => sum + Number(o.tax_total), 0);
    const avgOrder     = orders.length ? totalRevenue / orders.length : 0;

    const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const prevCount   = prevOrders.length;
    const prevAvg     = prevCount ? prevRevenue / prevCount : 0;

    const pctRevenue = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
    const pctOrders  = prevCount > 0 ? ((orders.length - prevCount) / prevCount) * 100 : null;
    const pctAvg     = prevAvg > 0 ? ((avgOrder - prevAvg) / prevAvg) * 100 : null;

    // --- Order lines for top products & categories ---
    const { data: lines, error: linesErr } = await supabaseAdmin
      .from("order_lines")
      .select("product_name, qty, subtotal, product_id, products(category_id, categories(name, color))")
      .in("order_id", orders.map(o => o.id));

    if (linesErr) throw linesErr;

    const productMap = {};
    const categoryMap = {};

    for (const line of (lines || [])) {
      const name = line.product_name;
      if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 };
      productMap[name].qty += Number(line.qty);
      productMap[name].revenue += Number(line.subtotal);

      const catName = line.products?.categories?.name;
      const catColor = line.products?.categories?.color;
      if (catName) {
        if (!categoryMap[catName]) categoryMap[catName] = { revenue: 0, color: catColor };
        categoryMap[catName].revenue += Number(line.subtotal);
      }
    }

    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 10)
      .map(([name, stats]) => ({ name, ...stats }));

    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, stats]) => ({ name, ...stats }));

    // --- Sales trend (group by day, last 14 days) ---
    const salesByDay = {};
    for (const o of orders) {
      const day = o.created_at.slice(0, 10);
      if (!salesByDay[day]) salesByDay[day] = { revenue: 0, count: 0 };
      salesByDay[day].revenue += Number(o.total);
      salesByDay[day].count++;
    }
    const salesTrend = Object.entries(salesByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ date, revenue: d.revenue, count: d.count }));

    // --- Recent orders (top 5) ---
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(o => ({ id: o.id, total: o.total, created_at: o.created_at, source: o.source }));

    res.json({
      totalOrders: orders.length,
      totalRevenue,
      totalTax,
      avgOrder,
      pctRevenue,
      pctOrders,
      pctAvg,
      topProducts,
      topCategories,
      salesTrend,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate report" });
  }
});

module.exports = router;
