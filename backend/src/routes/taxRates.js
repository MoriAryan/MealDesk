const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tax_rates")
      .select("id, label, rate, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return res.json({ taxRates: data || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch tax rates" });
  }
});

module.exports = router;
