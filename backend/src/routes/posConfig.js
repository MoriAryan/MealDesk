const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("pos_config").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    res.json({ posConfigs: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch POS terminals" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const { data, error } = await supabaseAdmin
      .from("pos_config")
      .insert({ name: name.trim(), created_by: req.user.id })
      .select().single();

    if (error) throw error;
    res.status(201).json({ posConfig: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create POS terminal" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("pos_config").select("*").eq("id", req.params.id).single();
    if (error) throw error;
    res.json({ posConfig: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch POS terminal" });
  }
});

router.put("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { name, cashEnabled, digitalEnabled, upiEnabled, upiId, selfOrderingEnabled, selfOrderingMode, bgColor } = req.body;

    const { data, error } = await supabaseAdmin
      .from("pos_config")
      .update({
        name: name ? name.trim() : undefined,
        cash_enabled: cashEnabled,
        digital_enabled: digitalEnabled,
        upi_enabled: upiEnabled,
        upi_id: upiId,
        self_ordering_enabled: selfOrderingEnabled,
        self_ordering_mode: selfOrderingMode,
        bg_color: bgColor
      })
      .eq("id", req.params.id)
      .select().single();

    if (error) throw error;
    res.json({ posConfig: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update POS terminal" });
  }
});

module.exports = router;
