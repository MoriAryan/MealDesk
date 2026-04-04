const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

// GET /api/payments — list all payments with order info
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

module.exports = router;
