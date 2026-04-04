const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { search, category_id: categoryId, pos_config_id: posConfigId } = req.query;

    let query = supabaseAdmin
      .from("products")
      .select(
        "id, pos_config_id, category_id, tax_rate_id, name, description, price, uom, active, created_at, updated_at, categories(name,color), tax_rates(label,rate)"
      )
      .order("created_at", { ascending: false });

    if (posConfigId) query = query.eq("pos_config_id", posConfigId);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (search) query = query.ilike("name", `%${String(search).trim()}%`);

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return res.json({ products: data || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, pos_config_id, category_id, tax_rate_id, name, description, price, uom, active, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (productError) {
      throw new Error(productError.message);
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { data: variants, error: variantsError } = await supabaseAdmin
      .from("product_variants")
      .select("id, product_id, attribute_name, value, unit, extra_price, created_at, updated_at")
      .eq("product_id", id)
      .order("created_at", { ascending: true });

    if (variantsError) {
      throw new Error(variantsError.message);
    }

    return res.json({ product, variants: variants || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch product" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    const {
      posConfigId,
      categoryId,
      taxRateId,
      name,
      description,
      price,
      uom,
      variants = [],
    } = req.body || {};

    if (!posConfigId || !categoryId || !taxRateId || !name || price == null || !uom) {
      return res.status(400).json({
        message: "posConfigId, categoryId, taxRateId, name, price and uom are required",
      });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .insert({
        pos_config_id: posConfigId,
        category_id: categoryId,
        tax_rate_id: taxRateId,
        name: String(name).trim(),
        description: description ? String(description) : null,
        price,
        uom,
        active: true,
      })
      .select("id, pos_config_id, category_id, tax_rate_id, name, description, price, uom, active, created_at, updated_at")
      .single();

    if (productError || !product) {
      throw new Error(productError?.message || "Failed to create product");
    }

    const cleanVariants = Array.isArray(variants)
      ? variants
          .filter((variant) => variant && variant.attributeName && variant.value)
          .map((variant) => ({
            product_id: product.id,
            attribute_name: String(variant.attributeName).trim(),
            value: String(variant.value).trim(),
            unit: variant.unit || null,
            extra_price: variant.extraPrice || 0,
          }))
      : [];

    if (cleanVariants.length > 0) {
      const { error: variantsError } = await supabaseAdmin.from("product_variants").insert(cleanVariants);
      if (variantsError) {
        throw new Error(variantsError.message);
      }
    }

    return res.status(201).json({ product });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to create product" });
  }
});

router.put("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoryId,
      taxRateId,
      name,
      description,
      price,
      uom,
      active,
      variants = [],
    } = req.body || {};

    const updates = {};

    if (typeof categoryId === "string") updates.category_id = categoryId;
    if (typeof taxRateId === "string") updates.tax_rate_id = taxRateId;
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof description === "string" || description === null) updates.description = description;
    if (typeof price === "number") updates.price = price;
    if (typeof uom === "string" && uom.trim()) updates.uom = uom;
    if (typeof active === "boolean") updates.active = active;

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("id, pos_config_id, category_id, tax_rate_id, name, description, price, uom, active, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const incoming = Array.isArray(variants) ? variants : [];
    const existingIds = incoming.filter((variant) => variant.id).map((variant) => variant.id);

    if (incoming.length) {
      for (const variant of incoming) {
        const payload = {
          product_id: id,
          attribute_name: String(variant.attributeName || "").trim(),
          value: String(variant.value || "").trim(),
          unit: variant.unit || null,
          extra_price: variant.extraPrice || 0,
        };

        if (!payload.attribute_name || !payload.value) {
          continue;
        }

        if (variant.id) {
          await supabaseAdmin.from("product_variants").update(payload).eq("id", variant.id).eq("product_id", id);
        } else {
          await supabaseAdmin.from("product_variants").insert(payload);
        }
      }
    }

    if (existingIds.length > 0) {
      await supabaseAdmin
        .from("product_variants")
        .delete()
        .eq("product_id", id)
        .not("id", "in", `(${existingIds.map((variantId) => `\"${variantId}\"`).join(",")})`);
    } else if (incoming.length === 0) {
      await supabaseAdmin.from("product_variants").delete().eq("product_id", id);
    }

    return res.json({ product });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to update product" });
  }
});

router.delete("/:id/variants/:variantId", requireRoles("admin"), async (req, res) => {
  try {
    const { id, variantId } = req.params;

    const { error } = await supabaseAdmin
      .from("product_variants")
      .delete()
      .eq("id", variantId)
      .eq("product_id", id);

    if (error) {
      throw new Error(error.message);
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to delete variant" });
  }
});

router.patch("/bulk-archive", requireRoles("admin"), async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];

    if (!ids.length) {
      return res.status(400).json({ message: "ids are required" });
    }

    const { error } = await supabaseAdmin.from("products").update({ active: false }).in("id", ids);

    if (error) {
      throw new Error(error.message);
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to archive products" });
  }
});

router.delete("/bulk-delete", requireRoles("admin"), async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];

    if (!ids.length) {
      return res.status(400).json({ message: "ids are required" });
    }

    const { error } = await supabaseAdmin.from("products").delete().in("id", ids);

    if (error) {
      throw new Error(error.message);
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to delete products" });
  }
});

module.exports = router;
