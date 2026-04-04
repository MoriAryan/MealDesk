const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch orders" });
  }
});

module.exports = router;
