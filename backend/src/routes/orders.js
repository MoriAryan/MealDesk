const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

// GET /api/orders — list all orders with lines & customer name
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        customers ( name ),
        pos_sessions ( id, opened_at ),
        order_lines (
          id, product_name, qty, unit_price, tax_rate, uom, discount, subtotal, total, notes
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch orders" });
  }
});

// PATCH /api/orders/:id/pay — mark an existing order as paid + record payment (idempotent)
router.patch("/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = "cash", customerId = null } = req.body;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeCustomerId = customerId && uuidRegex.test(customerId) ? customerId : null;

    // Fetch the order first to verify it exists
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If already paid, just return it (idempotent — safe to call multiple times)
    if (existingOrder.status === "paid") {
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("order_id", id)
        .limit(1)
        .single();
      return res.json({ order: existingOrder, payment: existingPayment || null });
    }

    // Build update fields
    const updateFields = { status: "paid", updated_at: new Date().toISOString() };
    if (safeCustomerId) updateFields.customer_id = safeCustomerId;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .update(updateFields)
      .eq("id", id)
      .select("*")
      .single();

    if (orderError) throw orderError;

    // Write payment record
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


// DELETE /api/orders/:id — delete a draft order
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow deleting draft orders
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

    // Delete lines first (FK constraint)
    await supabaseAdmin.from("order_lines").delete().eq("order_id", id);
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", id);
    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete order" });
  }
});

// PATCH /api/orders/:id/archive — archive a draft order
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

module.exports = router;
