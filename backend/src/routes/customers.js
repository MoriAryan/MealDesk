import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);
router.use(requireRoles("admin"));

// GET /api/customers -- list all customers
router.get("/", async (req, res) => {
  try {
    const { data: customers, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const customerIds = (customers || []).map((c) => c.id);
    let totalSalesMap = {};

    if (customerIds.length > 0) {
      const { data: orders, error: ordersErr } = await supabaseAdmin
        .from("orders")
        .select("customer_id, total")
        .eq("status", "paid")
        .in("customer_id", customerIds);

      if (ordersErr) throw ordersErr;
      for (const o of orders || []) {
        totalSalesMap[o.customer_id] = (totalSalesMap[o.customer_id] || 0) + Number(o.total);
      }
    }

    const result = (customers || []).map((c) => ({
      ...c,
      total_sales: totalSalesMap[c.id] || 0,
    }));

    res.json({ customers: result });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch customers" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, street1, street2, city, state, country } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert({
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        street1: street1 || null,
        street2: street2 || null,
        city: city || null,
        state: state || null,
        country: country || "India",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ customer: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create customer" });
  }
});

export default router;
