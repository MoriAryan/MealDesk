import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const posConfigId = req.query.pos_config_id || req.query.posConfigId;

    let query = supabaseAdmin
      .from("floors")
      .select("id, pos_config_id, name, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (posConfigId) {
      query = query.eq("pos_config_id", posConfigId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ floors: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch floors" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    const { posConfigId, name } = req.body;
    if (!posConfigId || !name) {
      return res.status(400).json({ message: "posConfigId and name are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("floors")
      .insert({
        pos_config_id: posConfigId,
        name: name.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ floor: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create floor" });
  }
});

router.patch("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "name is required" });
    const { data, error } = await supabaseAdmin
      .from("floors")
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ floor: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update floor" });
  }
});

router.delete("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("floors")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete floor" });
  }
});

export default router;
