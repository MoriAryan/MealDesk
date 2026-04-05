import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

const categoryColorPool = ["#378ADD", "#1D9E75", "#D85A30", "#D4537E", "#EF9F27", "#639922", "#7F77DD", "#E24B4A", "#888780"];

router.get("/", async (req, res) => {
  try {
    let query = supabaseAdmin.from("categories").select("id, pos_config_id, name, color, created_at, updated_at").order("created_at", { ascending: true });
    if (req.query.pos_config_id) query = query.eq("pos_config_id", req.query.pos_config_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ categories: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch categories" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    let { posConfigId, name, color } = req.body;
    if (!posConfigId || !name) return res.status(400).json({ message: "posConfigId and name are required" });

    if (!color) {
      const { count } = await supabaseAdmin.from("categories").select("id", { count: "exact", head: true }).eq("pos_config_id", posConfigId);
      color = categoryColorPool[(count || 0) % categoryColorPool.length];
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert({ pos_config_id: posConfigId, name: name.trim(), color })
      .select().single();

    if (error) throw error;
    res.status(201).json({ category: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create category" });
  }
});

router.put("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { name, color } = req.body;
    const cleanName = name ? name.trim() : undefined;
    const cleanColor = color ? color.trim() : undefined;

    const { data, error } = await supabaseAdmin
      .from("categories")
      .update({ name: cleanName, color: cleanColor })
      .eq("id", req.params.id)
      .select().single();

    if (error) throw error;
    res.json({ category: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update category" });
  }
});

router.delete("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { count } = await supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("category_id", req.params.id).eq("active", true);
    if (count > 0) return res.status(409).json({ message: `${count} active products use this category. Reassign or archive them first.` });

    const { error } = await supabaseAdmin.from("categories").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete category" });
  }
});

export default router;
