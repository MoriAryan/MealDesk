import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tax_rates")
      .select("id, label, rate, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return res.json({ taxRates: data || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch tax rates" });
  }
});

export default router;
