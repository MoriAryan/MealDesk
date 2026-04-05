import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/latest", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
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
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json({ order: data || null });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch latest order" });
  }
});

export default router;
