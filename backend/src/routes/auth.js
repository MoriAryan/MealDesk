const express = require("express");
const { buildAccessToken, buildRefreshToken } = require("../utils/token");
const { extractRefreshToken, hashRefreshToken } = require("../middleware/refreshToken");

const router = express.Router();

router.post("/signup", (_req, res) => {
  return res.status(501).json({
    message: "Signup endpoint scaffolded in Phase 1. Full implementation starts in Phase 2.",
  });
});

router.post("/login", (_req, res) => {
  return res.status(501).json({
    message: "Login endpoint scaffolded in Phase 1. Full implementation starts in Phase 2.",
  });
});

router.post("/refresh", (req, res) => {
  const refreshToken = extractRefreshToken(req);

  if (!refreshToken) {
    return res.status(400).json({ message: "Missing refresh token" });
  }

  return res.status(501).json({
    message: "Refresh rotation scaffolded in Phase 1. Full implementation starts in Phase 2.",
    tokenHashPreview: hashRefreshToken(refreshToken).slice(0, 12),
  });
});

router.post("/logout", (_req, res) => {
  return res.status(204).send();
});

router.post("/dev-token", (req, res) => {
  const { id, email, role } = req.body || {};

  if (!id || !email || !role) {
    return res.status(400).json({ message: "id, email, and role are required" });
  }

  const user = { id, email, role };

  return res.json({
    accessToken: buildAccessToken(user),
    refreshToken: buildRefreshToken(user),
  });
});

module.exports = router;
