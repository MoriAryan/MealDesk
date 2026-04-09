import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/latest", async (req, res) => {
  try {
    const { pos_config_id, pos_session_id } = req.query;

    let query = supabaseAdmin
      .from("orders")
      .select(`
        *,
        order_lines (
          id,
          product_name,
          qty,
          unit_price
        )
      `)
      .in("status", ["draft", "paid"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (pos_config_id) {
      query = query.eq("pos_config_id", pos_config_id);
    }
    if (pos_session_id) {
      query = query.eq("pos_session_id", pos_session_id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    res.json({ order: data || null });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch latest order" });
  }
});

export default router;
