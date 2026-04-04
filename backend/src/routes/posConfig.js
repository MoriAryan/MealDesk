const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("pos_config")
      .select("id, name, cash_enabled, digital_enabled, upi_enabled, upi_id, self_ordering_enabled, self_ordering_mode, bg_color, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return res.json({ posConfigs: data || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch POS terminals" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    const { name } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    const payload = {
      name: String(name).trim(),
      created_by: req.user.id,
    };

    const { data, error } = await supabaseAdmin
      .from("pos_config")
      .insert(payload)
      .select("id, name, cash_enabled, digital_enabled, upi_enabled, upi_id, self_ordering_enabled, self_ordering_mode, bg_color, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return res.status(201).json({ posConfig: data });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to create POS terminal" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("pos_config")
      .select("id, name, cash_enabled, digital_enabled, upi_enabled, upi_id, self_ordering_enabled, self_ordering_mode, bg_color, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({ message: "POS terminal not found" });
    }

    return res.json({ posConfig: data });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch POS terminal" });
  }
});

router.put("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      cashEnabled,
      digitalEnabled,
      upiEnabled,
      upiId,
      selfOrderingEnabled,
      selfOrderingMode,
      bgColor,
    } = req.body || {};

    const updates = {};

    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof cashEnabled === "boolean") updates.cash_enabled = cashEnabled;
    if (typeof digitalEnabled === "boolean") updates.digital_enabled = digitalEnabled;
    if (typeof upiEnabled === "boolean") updates.upi_enabled = upiEnabled;
    if (typeof upiId === "string") updates.upi_id = upiId.trim() || null;
    if (typeof selfOrderingEnabled === "boolean") updates.self_ordering_enabled = selfOrderingEnabled;
    if (typeof selfOrderingMode === "string" || selfOrderingMode === null) {
      updates.self_ordering_mode = selfOrderingMode;
    }
    if (typeof bgColor === "string") updates.bg_color = bgColor.trim() || null;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const { data, error } = await supabaseAdmin
      .from("pos_config")
      .update(updates)
      .eq("id", id)
      .select("id, name, cash_enabled, digital_enabled, upi_enabled, upi_id, self_ordering_enabled, self_ordering_mode, bg_color, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({ message: "POS terminal not found" });
    }

    return res.json({ posConfig: data });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to update POS terminal" });
  }
});

module.exports = router;
