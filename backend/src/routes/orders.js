import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        customers ( name ),
        pos_sessions ( id, opened_at ),
        order_lines (
          id, product_name, qty, unit_price, tax_rate, uom, discount, subtotal, total, notes
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) throw error;
    res.json({ orders: data || [], total: count || 0, page, limit });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch orders" });
  }
});

router.patch("/pay-draft", async (req, res) => {
  try {
    const { posConfigId, tableId, paymentMethod = "cash", customerId = null } = req.body;
    if (!posConfigId) return res.status(400).json({ message: "posConfigId required" });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeCustomerId = customerId && uuidRegex.test(customerId) ? customerId : null;
    const safeTableId = tableId && uuidRegex.test(tableId) ? tableId : null;

    let query = supabaseAdmin
      .from("orders")
      .select("*")
      .eq("pos_config_id", posConfigId)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1);

    if (safeTableId) query = query.eq("table_id", safeTableId);

    const { data: drafts, error: draftError } = await query;
    if (draftError) throw draftError;

    if (!drafts || drafts.length === 0) {
      return res.status(404).json({ message: "No draft order found for this table" });
    }

    const existingOrder = drafts[0];

    if (existingOrder.status === "paid") {
      return res.json({ order: existingOrder, payment: null, alreadyPaid: true });
    }

    const updateFields = { status: "paid", updated_at: new Date().toISOString() };
    if (safeCustomerId) updateFields.customer_id = safeCustomerId;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .update(updateFields)
      .eq("id", existingOrder.id)
      .select("*")
      .single();

    if (orderError) throw orderError;

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({ order_id: existingOrder.id, payment_method: paymentMethod, amount: existingOrder.total, paid_at: new Date().toISOString() })
      .select("*")
      .single();

    if (paymentError) throw paymentError;

    res.json({ order, payment });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed" });
  }
});

router.patch("/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = "cash", customerId = null } = req.body;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeCustomerId = customerId && uuidRegex.test(customerId) ? customerId : null;

    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (existingOrder.status === "paid") {
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("order_id", id)
        .limit(1)
        .single();
      return res.json({ order: existingOrder, payment: existingPayment || null });
    }

    const updateFields = { status: "paid", updated_at: new Date().toISOString() };
    if (safeCustomerId) updateFields.customer_id = safeCustomerId;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .update(updateFields)
      .eq("id", id)
      .select("*")
      .single();

    if (orderError) throw orderError;

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id: id,
        payment_method: paymentMethod,
        amount: order.total,
        paid_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (paymentError) throw paymentError;

    res.json({ order, payment });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to process payment" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "draft") {
      return res.status(400).json({ message: "Only draft orders can be deleted" });
    }

    await supabaseAdmin.from("order_lines").delete().eq("order_id", id);
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", id);
    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete order" });
  }
});

router.patch("/:id/archive", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("status", "draft")
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Draft order not found" });
    res.json({ order: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to archive order" });
  }
});

export default router;
