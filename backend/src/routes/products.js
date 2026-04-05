import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { search, category_id, pos_config_id } = req.query;

    let query = supabaseAdmin
      .from("products")
      .select("*, categories(name,color), tax_rates(label,rate), product_variants(*)")
      .order("created_at", { ascending: false });

    if (pos_config_id) query = query.eq("pos_config_id", pos_config_id);
    if (category_id) query = query.eq("category_id", category_id);
    if (search) query = query.ilike("name", `%${search.trim()}%`);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ products: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data: product, error: productError } = await supabaseAdmin.from("products").select("*").eq("id", req.params.id).single();
    if (productError) throw productError;

    const { data: variants, error: variantsError } = await supabaseAdmin.from("product_variants").select("*").eq("product_id", req.params.id).order("created_at", { ascending: true });
    if (variantsError) throw variantsError;

    res.json({ product, variants: variants || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch product" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    const { posConfigId, categoryId, taxRateId, name, description, price, uom, variants = [] } = req.body;

    if (!posConfigId || !categoryId || !taxRateId || !name || price == null || !uom) {
      return res.status(400).json({ message: "posConfigId, categoryId, taxRateId, name, price and uom are required" });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .insert({
        pos_config_id: posConfigId,
        category_id: categoryId,
        tax_rate_id: taxRateId,
        name: name.trim(),
        description,
        price,
        uom,
        active: true,
      })
      .select().single();

    if (productError) throw productError;

    const cleanVariants = (variants || [])
      .filter((v) => v.attributeName && v.value)
      .map((v) => ({
        product_id: product.id,
        attribute_name: v.attributeName.trim(),
        value: v.value.trim(),
        unit: v.unit || null,
        extra_price: v.extraPrice || 0,
      }));

    if (cleanVariants.length > 0) {
      const { error: variantsError } = await supabaseAdmin.from("product_variants").insert(cleanVariants);
      if (variantsError) throw variantsError;
    }

    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create product" });
  }
});

router.put("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { categoryId, taxRateId, name, description, price, uom, active, variants = [] } = req.body;

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .update({
        category_id: categoryId,
        tax_rate_id: taxRateId,
        name: name ? name.trim() : undefined,
        description,
        price,
        uom,
        active,
      })
      .eq("id", req.params.id)
      .select().single();

    if (productError) throw productError;

    const incoming = variants || [];
    const existingIds = incoming.filter((v) => v.id).map((v) => v.id);

    if (existingIds.length > 0) {
      await supabaseAdmin.from("product_variants").delete().eq("product_id", req.params.id).not("id", "in", `(${existingIds.map(id => `"${id}"`).join(",")})`);
    } else {
      await supabaseAdmin.from("product_variants").delete().eq("product_id", req.params.id);
    }

    const validVariants = incoming
      .filter((v) => v.attributeName && v.value)
      .map((v) => {
        const payload = {
          product_id: req.params.id,
          attribute_name: v.attributeName.trim(),
          value: v.value.trim(),
          unit: v.unit || null,
          extra_price: v.extraPrice || 0,
        };
        if (v.id) payload.id = v.id;
        return payload;
      });

    if (validVariants.length > 0) {
      const { error: upsertError } = await supabaseAdmin.from("product_variants").upsert(validVariants);
      if (upsertError) throw upsertError;
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update product" });
  }
});

router.delete("/:id/variants/:variantId", requireRoles("admin"), async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("product_variants").delete().eq("id", req.params.variantId).eq("product_id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete variant" });
  }
});

router.patch("/bulk-archive", requireRoles("admin"), async (req, res) => {
  try {
    const ids = req.body?.ids || [];
    if (!ids.length) return res.status(400).json({ message: "ids are required" });

    const { error } = await supabaseAdmin.from("products").update({ active: false }).in("id", ids);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to archive products" });
  }
});

router.delete("/bulk-delete", requireRoles("admin"), async (req, res) => {
  try {
    const ids = req.body?.ids || [];
    if (!ids.length) return res.status(400).json({ message: "ids are required" });

    const { error } = await supabaseAdmin.from("products").delete().in("id", ids);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete products" });
  }
});

export default router;
