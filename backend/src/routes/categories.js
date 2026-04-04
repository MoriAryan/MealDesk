const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

const categoryColorPool = [
  "#378ADD",
  "#1D9E75",
  "#D85A30",
  "#D4537E",
  "#EF9F27",
  "#639922",
  "#7F77DD",
  "#E24B4A",
  "#888780",
];

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { pos_config_id: posConfigId } = req.query;

    let query = supabaseAdmin
      .from("categories")
      .select("id, pos_config_id, name, color, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (posConfigId) {
      query = query.eq("pos_config_id", posConfigId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return res.json({ categories: data || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch categories" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    const { posConfigId, name, color } = req.body || {};

    if (!posConfigId || !name) {
      return res.status(400).json({ message: "posConfigId and name are required" });
    }

    const cleanName = String(name).trim();
    if (!cleanName) {
      return res.status(400).json({ message: "Category name cannot be empty" });
    }

    let resolvedColor = color;

    if (!resolvedColor) {
      const { count, error: countError } = await supabaseAdmin
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("pos_config_id", posConfigId);

      if (countError) {
        throw new Error(countError.message);
      }

      resolvedColor = categoryColorPool[(count || 0) % categoryColorPool.length];
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert({
        pos_config_id: posConfigId,
        name: cleanName,
        color: resolvedColor,
      })
      .select("id, pos_config_id, name, color, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return res.status(201).json({ category: data });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to create category" });
  }
});

router.put("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body || {};

    const updates = {};

    if (typeof name === "string") {
      const cleanName = name.trim();
      if (!cleanName) {
        return res.status(400).json({ message: "Category name cannot be empty" });
      }
      updates.name = cleanName;
    }

    if (typeof color === "string" && color.trim()) {
      updates.color = color.trim();
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select("id, pos_config_id, name, color, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({ category: data });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to update category" });
  }
});

router.delete("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const { count, error: countError } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id)
      .eq("active", true);

    if (countError) {
      throw new Error(countError.message);
    }

    if ((count || 0) > 0) {
      return res.status(409).json({
        message: `${count} active products use this category. Reassign or archive them first.`,
      });
    }

    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to delete category" });
  }
});

module.exports = router;
