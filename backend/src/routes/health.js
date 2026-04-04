const express = require("express");
const { supabaseAdmin } = require("../config/supabase");

const router = express.Router();

router.get("/health", async (_req, res) => {
  const response = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      api: "up",
      supabase: "unknown",
    },
  };

  try {
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    response.services.supabase = "up";
  } catch (_error) {
    response.services.supabase = "down";
  }

  return res.json(response);
});

module.exports = router;
