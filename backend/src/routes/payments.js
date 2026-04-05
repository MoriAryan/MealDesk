import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        order_id,
        payment_method,
        amount,
        paid_at,
        created_at,
        orders ( order_number )
      `)
      .order("paid_at", { ascending: false });

    if (error) throw error;
    res.json({ payments: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch payments" });
  }
});

export default router;
