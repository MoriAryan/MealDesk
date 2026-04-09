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

export default router;
