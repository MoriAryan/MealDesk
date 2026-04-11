import crypto from "crypto";
import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const posConfigId = req.query.pos_config_id || req.query.posConfigId;
    const floorId = req.query.floor_id || req.query.floorId;
    const active = req.query.active;

    let query = supabaseAdmin
      .from("tables")
      .select("id, floor_id, table_number, seats, active, appointment_resource, qr_token, created_at, updated_at, floors(id, name, pos_config_id)")
      .order("table_number", { ascending: true });

    if (floorId) {
      query = query.eq("floor_id", floorId);
    }

    if (typeof active !== "undefined") {
      query = query.eq("active", String(active).toLowerCase() === "true");
    }

    if (posConfigId) {
      query = query.eq("floors.pos_config_id", posConfigId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ tables: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch tables" });
  }
});

router.post("/", requireRoles("admin"), async (req, res) => {
  try {
    const { floorId, tableNumber, seats, active = true, appointmentResource = null, qrToken = null } = req.body;

    if (!floorId || !tableNumber || !seats) {
      return res.status(400).json({ message: "floorId, tableNumber and seats are required" });
    }

    const payload = {
      floor_id: floorId,
      table_number: String(tableNumber).trim(),
      seats: Number(seats),
      active: Boolean(active),
      appointment_resource: appointmentResource,
      qr_token: qrToken || crypto.randomUUID().replace(/-/g, "").slice(0, 40),
    };

    const { data, error } = await supabaseAdmin
      .from("tables")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ table: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create table" });
  }
});

router.patch("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { tableNumber, seats, active } = req.body;
    const updates = {};
    if (tableNumber !== undefined) updates.table_number = String(tableNumber).trim();
    if (seats !== undefined) updates.seats = Number(seats);
    if (active !== undefined) updates.active = Boolean(active);

    const { data, error } = await supabaseAdmin
      .from("tables")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ table: data });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update table" });
  }
});

router.delete("/:id", requireRoles("admin"), async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("tables")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete table" });
  }
});

export default router;
