import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// GET /api/reports/summary?from=&to=&pos_config_id=
router.get("/summary", requireRoles("admin"), async (req, res) => {
  try {
    const { from, to, pos_config_id, pos_session_id, opened_by, product_id } = req.query;

    let query = supabaseAdmin
      .from("orders")
      .select("id, total, subtotal, tax_total, status, source, created_at, pos_config_id, pos_session_id");

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    if (pos_config_id) query = query.eq("pos_config_id", pos_config_id);
    if (pos_session_id) query = query.eq("pos_session_id", pos_session_id);

    if (opened_by) {
      let sessionsQuery = supabaseAdmin
        .from("pos_sessions")
        .select("id")
        .eq("opened_by", opened_by);

      if (pos_config_id) sessionsQuery = sessionsQuery.eq("pos_config_id", pos_config_id);

      const { data: sessions, error: sessionsError } = await sessionsQuery;
      if (sessionsError) throw sessionsError;

      const sessionIds = (sessions || []).map((s) => s.id);
      if (!sessionIds.length) {
        return res.json({
          totalOrders: 0,
          paidOrders: 0,
          draftOrders: 0,
          totalRevenue: 0,
          totalTax: 0,
          avgOrder: 0,
          pctRevenue: null,
          pctOrders: null,
          pctAvg: null,
          topProducts: [],
          topCategories: [],
          salesTrend: [],
          recentOrders: [],
        });
      }
      query = query.in("pos_session_id", sessionIds);
    }

    const { data: allOrders, error } = await query;
    if (error) throw error;

    let orders = allOrders || [];

    if (product_id && orders.length) {
      const orderIds = orders.map((o) => o.id);
      const { data: productLines, error: productLinesError } = await supabaseAdmin
        .from("order_lines")
        .select("order_id")
        .eq("product_id", product_id)
        .in("order_id", orderIds);

      if (productLinesError) throw productLinesError;

      const matchedOrderIds = new Set((productLines || []).map((l) => l.order_id));
      orders = orders.filter((o) => matchedOrderIds.has(o.id));
    }

    const paidOrders = orders.filter((o) => o.status === "paid");
    const draftOrders = orders.filter((o) => o.status === "draft");

    let prevOrders = [];
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const periodMs = toDate.getTime() - fromDate.getTime();
      const prevFrom = new Date(fromDate.getTime() - periodMs).toISOString();
      const prevTo = new Date(fromDate.getTime()).toISOString();

      let prevQuery = supabaseAdmin
        .from("orders")
        .select("id, total, subtotal, tax_total, status, pos_session_id")
        .gte("created_at", prevFrom)
        .lte("created_at", prevTo);

      if (pos_config_id) prevQuery = prevQuery.eq("pos_config_id", pos_config_id);
      if (pos_session_id) prevQuery = prevQuery.eq("pos_session_id", pos_session_id);

      const { data: prev } = await prevQuery;
      prevOrders = (prev || []).filter((o) => o.status === "paid");
    }

    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalTax = paidOrders.reduce((sum, o) => sum + Number(o.tax_total), 0);
    const avgOrder = paidOrders.length ? totalRevenue / paidOrders.length : 0;

    const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const prevCount = prevOrders.length;
    const prevAvg = prevCount ? prevRevenue / prevCount : 0;

    const pctRevenue = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
    const pctOrders = prevCount > 0 ? ((paidOrders.length - prevCount) / prevCount) * 100 : null;
    const pctAvg = prevAvg > 0 ? ((avgOrder - prevAvg) / prevAvg) * 100 : null;

    let lines = [];
    const chunkSize = 25;
    const orderIds = orders.map((o) => o.id);

    for (let i = 0; i < orderIds.length; i += chunkSize) {
      const chunk = orderIds.slice(i, i + chunkSize);
      const { data: chunkLines, error: chunkErr } = await supabaseAdmin
        .from("order_lines")
        .select("product_name, qty, subtotal, product_id, products(category_id, categories(name, color))")
        .in("order_id", chunk);

      if (chunkErr) throw chunkErr;
      if (chunkLines) lines.push(...chunkLines);
    }

    const productMap = {};
    const categoryMap = {};

    for (const line of lines || []) {
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

    const salesByDay = {};
    for (const o of paidOrders) {
      const day = o.created_at.slice(0, 10);
      if (!salesByDay[day]) salesByDay[day] = { revenue: 0, count: 0 };
      salesByDay[day].revenue += Number(o.total);
      salesByDay[day].count++;
    }

    const salesTrend = Object.entries(salesByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ date, revenue: d.revenue, count: d.count }));

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((o) => ({ id: o.id, total: o.total, created_at: o.created_at, source: o.source, status: o.status }));

    res.json({
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      draftOrders: draftOrders.length,
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

export default router;
