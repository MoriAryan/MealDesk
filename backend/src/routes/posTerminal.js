const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

// POST /api/pos-terminal/order
router.post("/order", async (req, res) => {
  try {
    const {
      tableId,
      items,
      status = "draft",
      source = "pos",
      createKitchenTicket = false,
      posConfigId,
      customerId = null,
      paymentMethod = null,    // "cash" | "digital" | "upi"
      posSessionId = null,
    } = req.body;

    if (!posConfigId) {
      return res.status(400).json({ message: "posConfigId is required." });
    }

    // 1. Calculate totals
    let subtotal = 0;
    let tax_total = 0;

    for (const item of items) {
      const extraPrice = item.variant ? Number(item.variant.extra_price || 0) : 0;
      const unitPrice = Number(item.product.price) + extraPrice;
      const lineSub = unitPrice * item.quantity;
      const rate = item.product.tax_rates?.rate ? Number(item.product.tax_rates.rate) : 0;
      subtotal += lineSub;
      tax_total += lineSub * (rate / 100);
    }
    const total = subtotal + tax_total;

    // 2. Generate an order number
    const orderNumber = `POS-${Date.now().toString().slice(-6)}`;

    // Validate tableId — floor plan may use non-UUID dummy IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeTableId = tableId && uuidRegex.test(tableId) ? tableId : null;
    const safeCustomerId = customerId && uuidRegex.test(customerId) ? customerId : null;
    const safeSessionId = posSessionId && uuidRegex.test(posSessionId) ? posSessionId : null;

    // 3. Create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        pos_config_id: posConfigId,
        table_id: safeTableId,
        customer_id: safeCustomerId,
        pos_session_id: safeSessionId,
        status,
        source,
        subtotal,
        tax_total,
        total,
        is_invoice: true,
      })
      .select("*")
      .single();

    if (orderError) throw orderError;

    // 4. Create order lines
    const orderLines = items.map((item) => {
      const extraPrice = item.variant ? Number(item.variant.extra_price || 0) : 0;
      const unitPrice = Number(item.product.price) + extraPrice;
      const lineSub = unitPrice * item.quantity;
      const rate = item.product.tax_rates?.rate ? Number(item.product.tax_rates.rate) : 0;
      const productName = item.variant
        ? `${item.product.name} (${item.variant.value})`
        : item.product.name;
      return {
        order_id: order.id,
        product_id: item.product.id,
        product_name: productName,
        qty: item.quantity,
        unit_price: unitPrice,
        tax_rate: rate,
        uom: item.product.uom || "unit",
        discount: 0,
        subtotal: lineSub,
        total: lineSub * (1 + rate / 100),
      };
    });

    const { data: insertedLines, error: linesError } = await supabaseAdmin
      .from("order_lines")
      .insert(orderLines)
      .select("*");

    if (linesError) throw linesError;

    // 5. If status is paid, write a payment record
    let paymentData = null;
    if (status === "paid" && total > 0) {
      const method = paymentMethod || "cash"; // default to cash if not specified
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          order_id: order.id,
          payment_method: method,
          amount: total,
          paid_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (paymentError) throw paymentError;
      paymentData = payment;
    }

    // 6. If send to kitchen, create a kitchen ticket
    let ticketData = null;
    if (createKitchenTicket) {
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from("kitchen_tickets")
        .insert({
          pos_config_id: posConfigId,
          order_id: order.id,
          order_number: order.order_number,
          stage: "to_cook",
        })
        .select("*")
        .single();

      if (ticketError) throw ticketError;
      ticketData = ticket;

      // Link order lines to kitchen items
      const ticketItems = insertedLines.map((line, index) => ({
        kitchen_ticket_id: ticket.id,
        order_line_id: line.id,
        product_name: items[index].product.name,
        qty: line.qty,
        prepared: false,
      }));

      const { error: tItemsError } = await supabaseAdmin
        .from("kitchen_ticket_items")
        .insert(ticketItems);

      if (tItemsError) throw tItemsError;
    }

    res.json({ order, ticket: ticketData, payment: paymentData });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: error.message || "Failed to create order" });
  }
});

module.exports = router;
