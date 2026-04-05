import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

const allowedMethods = ["cash", "digital", "upi"];

router.get("/", async (req, res) => {
  try {
    let query = supabaseAdmin.from("payment_methods").select("*").order("created_at", { ascending: true });
    if (req.query.pos_config_id) query = query.eq("pos_config_id", req.query.pos_config_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ paymentMethods: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch payment methods" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    const { posConfigId, method, enabled = true, upiId } = req.body;
    if (!posConfigId || !method) return res.status(400).json({ message: "posConfigId and method are required" });
    if (!allowedMethods.includes(method)) return res.status(400).json({ message: "Unsupported payment method type" });

    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .upsert({ pos_config_id: posConfigId, method, enabled, upi_id: method === "upi" ? upiId : null }, { onConflict: "pos_config_id,method" })
      .select().single();

    if (error) throw error;
    res.status(201).json({ paymentMethod: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create payment method" });
  }
});

router.put("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { enabled, upiId } = req.body;
    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .update({ enabled, upi_id: upiId })
      .eq("id", req.params.id)
      .select().single();

    if (error) throw error;
    res.json({ paymentMethod: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update payment method" });
  }
});

router.delete("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("payment_methods").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete payment method" });
  }
});

export default router;
