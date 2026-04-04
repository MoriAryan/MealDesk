const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();
const allowedMethods = ["cash", "digital", "upi"];

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { pos_config_id: posConfigId } = req.query;

    let query = supabaseAdmin
      .from("payment_methods")
      .select("id, pos_config_id, method, enabled, upi_id, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (posConfigId) {
      query = query.eq("pos_config_id", posConfigId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return res.json({ paymentMethods: data || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch payment methods" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    const { posConfigId, method, enabled, upiId } = req.body || {};

    if (!posConfigId || !method) {
      return res.status(400).json({ message: "posConfigId and method are required" });
    }

    if (!allowedMethods.includes(method)) {
      return res.status(400).json({ message: "Unsupported payment method type" });
    }

    const payload = {
      pos_config_id: posConfigId,
      method,
      enabled: typeof enabled === "boolean" ? enabled : true,
      upi_id: method === "upi" ? String(upiId || "").trim() || null : null,
    };

    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .upsert(payload, { onConflict: "pos_config_id,method" })
      .select("id, pos_config_id, method, enabled, upi_id, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return res.status(201).json({ paymentMethod: data });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to create payment method" });
  }
});

router.put("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, upiId } = req.body || {};

    const updates = {};
    if (typeof enabled === "boolean") updates.enabled = enabled;
    if (typeof upiId === "string") updates.upi_id = upiId.trim() || null;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .update(updates)
      .eq("id", id)
      .select("id, pos_config_id, method, enabled, upi_id, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    return res.json({ paymentMethod: data });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to update payment method" });
  }
});

router.delete("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin.from("payment_methods").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to delete payment method" });
  }
});

module.exports = router;
