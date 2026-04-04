const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { pos_config_id } = req.query;
    let query = supabaseAdmin
      .from("kitchen_tickets")
      .select(`
        *,
        kitchen_ticket_items (
          *,
          order_lines (
            products (
              categories (name)
            )
          )
        )
      `)
      .order("sent_at", { ascending: false });

    if (pos_config_id) query = query.eq("pos_config_id", pos_config_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ tickets: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch kitchen tickets" });
  }
});

router.put("/:id/stage", async (req, res) => {
  try {
    const { stage } = req.body;
    const { data, error } = await supabaseAdmin
      .from("kitchen_tickets")
      .update({ stage })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ ticket: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update ticket stage" });
  }
});

router.put("/:id/items/:itemId/prepared", async (req, res) => {
  try {
    const { prepared } = req.body;
    const { data, error } = await supabaseAdmin
      .from("kitchen_ticket_items")
      .update({ prepared })
      .eq("id", req.params.itemId)
      .eq("kitchen_ticket_id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ item: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update item" });
  }
});

// Mock Ticket endpoint for testing
router.post("/mock-ticket", async (req, res) => {
  try {
    let { posConfigId } = req.body;
    
    // Fallback to finding the first pos config for easy testing
    if (!posConfigId) {
      const { data: configs } = await supabaseAdmin.from("pos_config").select("id").limit(1);
      if (configs && configs.length > 0) posConfigId = configs[0].id;
      else return res.status(400).json({ message: "No POS Config available to attach ticket to." });
    }

    const orderNumber = "MOCK-" + Math.floor(Math.random() * 10000);
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        pos_config_id: posConfigId,
        status: "draft"
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("kitchen_tickets")
      .insert({
        order_id: order.id,
        order_number: orderNumber,
        pos_config_id: posConfigId,
        stage: "to_cook"
      })
      .select()
      .single();
    if (ticketError) throw ticketError;

    // Shuffle products and grab 2 to 4 products for the ticket
    const { data: allProds } = await supabaseAdmin.from("products").select("*");
    const numItems = Math.floor(Math.random() * 3) + 2; // 2 to 4 items
    const prods = (allProds || []).sort(() => 0.5 - Math.random()).slice(0, numItems);
    
    const lines = [];
    if (prods.length > 0) {
      for (const p of prods) {
        const { data: line } = await supabaseAdmin.from("order_lines").insert({
          order_id: order.id,
          product_id: p.id,
          product_name: p.name,
          unit_price: p.price,
          tax_rate: 5,
          uom: p.uom,
          qty: Math.floor(Math.random() * 3) + 1
        }).select().single();
        lines.push(line);
      }
    }

    const ticketItems = [];
    for (const l of lines) {
      const { data: item } = await supabaseAdmin.from("kitchen_ticket_items").insert({
        kitchen_ticket_id: ticket.id,
        order_line_id: l.id,
        product_name: l.product_name,
        qty: l.qty,
        prepared: false
      }).select().single();
      ticketItems.push(item);
    }

    res.status(201).json({ ticket, items: ticketItems });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create mock ticket" });
  }
});

module.exports = router;
