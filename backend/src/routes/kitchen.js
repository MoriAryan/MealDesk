import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// GET /api/kitchen
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
    const ticketId = req.params.id;

    const { data, error } = await supabaseAdmin
      .from("kitchen_ticket_items")
      .update({ prepared })
      .eq("id", req.params.itemId)
      .eq("kitchen_ticket_id", ticketId)
      .select()
      .single();

    if (error) throw error;

    // Auto-complete ticket if all items are prepared
    const { data: allItems } = await supabaseAdmin
      .from("kitchen_ticket_items")
      .select("prepared")
      .eq("kitchen_ticket_id", ticketId);

    const allPrepared = allItems?.length > 0 && allItems.every(i => i.prepared);
    if (allPrepared) {
      await supabaseAdmin
        .from("kitchen_tickets")
        .update({ stage: "completed" })
        .eq("id", ticketId);
    }

    res.json({ item: data, autoCompleted: allPrepared });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update item" });
  }
});

// Mock Ticket endpoint for testing
router.post("/mock-ticket", async (req, res) => {
  try {
    let { posConfigId } = req.body;

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
        status: "draft",
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
        stage: "to_cook",
      })
      .select()
      .single();
    if (ticketError) throw ticketError;

    const { data: allProds } = await supabaseAdmin.from("products").select("*");
    const numItems = Math.floor(Math.random() * 3) + 2;
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
          qty: Math.floor(Math.random() * 3) + 1,
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
        prepared: false,
      }).select().single();
      ticketItems.push(item);
    }

    res.status(201).json({ ticket, items: ticketItems });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create mock ticket" });
  }
});

export default router;
