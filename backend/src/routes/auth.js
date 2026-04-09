import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import env from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";
import { buildAccessToken, buildRefreshToken } from "../utils/token.js";
import { requireAuth } from "../middleware/auth.js";
import { extractRefreshToken, hashRefreshToken } from "../middleware/refreshToken.js";

const router = express.Router();
const refreshCookieName = "refresh_token";
const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many auth attempts. Please try again later.",
  },
});

function getRefreshCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    secure: env.nodeEnv === "production",
    path: "/",
    maxAge: Math.max(1, expiresAt.getTime() - Date.now()),
  };
}

function setRefreshCookie(res, refreshToken, expiresAt) {
  res.cookie(refreshCookieName, refreshToken, getRefreshCookieOptions(expiresAt));
}

async function getRoleIdByCode(code) {
  const { data, error } = await supabaseAdmin.from("roles").select("id").eq("code", code).single();
  if (error || !data) throw new Error(`Role not found: ${code}`);
  return data.id;
}

async function getRoleCodeById(roleId) {
  const { data, error } = await supabaseAdmin.from("roles").select("code").eq("id", roleId).single();
  if (error || !data) throw new Error("Failed to resolve user role");
  return data.code;
}

async function issueSession(user) {
  const accessToken = buildAccessToken(user);
  const refreshToken = buildRefreshToken(user);
  const expiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

  const { error } = await supabaseAdmin.from("refresh_tokens").insert({
    user_id: user.id,
    token_hash: hashRefreshToken(refreshToken),
    expires_at: expiresAt.toISOString(),
    revoked: false,
  });

  if (error) throw new Error(`Failed to persist refresh token: ${error.message}`);
  return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
}

router.post("/signup", authAttemptLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "name, email, and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

    const normalizedEmail = email.trim().toLowerCase();
    const { count } = await supabaseAdmin.from("users").select("id", { count: "exact", head: true });

    const roleCode = (count || 0) === 0 ? "admin" : "cashier";
    const [roleId, passwordHash] = await Promise.all([getRoleIdByCode(roleCode), bcrypt.hash(password, 10)]);

    const { data: createdUser, error } = await supabaseAdmin
      .from("users")
      .insert({ role_id: roleId, name: name.trim(), email: normalizedEmail, password_hash: passwordHash })
      .select("id, name, email")
      .single();

    if (error) throw error;

    const user = { ...createdUser, role: roleCode };
    const session = await issueSession(user);
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);

    return res.status(201).json({ accessToken: session.accessToken, user });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Signup failed" });
  }
});

router.post("/login", authAttemptLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const { data: userRow, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, password_hash, role_id")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (error || !userRow || !(await bcrypt.compare(password, userRow.password_hash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = { id: userRow.id, name: userRow.name, email: userRow.email, role: await getRoleCodeById(userRow.role_id) };
    const session = await issueSession(user);
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);

    return res.json({ accessToken: session.accessToken, user });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Login failed" });
  }
});

router.post("/refresh", authAttemptLimiter, async (req, res) => {
  try {
    const refreshToken = extractRefreshToken(req);
    if (!refreshToken) return res.status(400).json({ message: "Missing refresh token" });

    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
    if (!decoded || decoded.type !== "refresh") return res.status(401).json({ message: "Invalid refresh token" });

    const { data: storedToken, error } = await supabaseAdmin
      .from("refresh_tokens")
      .select("id, user_id, revoked, expires_at")
      .eq("token_hash", hashRefreshToken(refreshToken))
      .eq("user_id", decoded.sub)
      .single();

    if (error || !storedToken || storedToken.revoked || new Date(storedToken.expires_at) <= Date.now()) {
      return res.status(401).json({ message: "Refresh token not recognized or expired" });
    }

    await supabaseAdmin.from("refresh_tokens").update({ revoked: true }).eq("id", storedToken.id);

    const { data: userRow } = await supabaseAdmin.from("users").select("id, name, email, role_id").eq("id", storedToken.user_id).single();
    if (!userRow) return res.status(401).json({ message: "User not found for refresh token" });

    const user = { id: userRow.id, name: userRow.name, email: userRow.email, role: await getRoleCodeById(userRow.role_id) };
    const session = await issueSession(user);
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);

    return res.json({ accessToken: session.accessToken, user });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = extractRefreshToken(req);
  if (refreshToken) {
    await supabaseAdmin.from("refresh_tokens").update({ revoked: true }).eq("token_hash", hashRefreshToken(refreshToken));
  }
  res.clearCookie(refreshCookieName, getRefreshCookieOptions(new Date()));
  return res.status(204).send();
});

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

if (env.nodeEnv !== "production") {
  router.post("/dev-token", (req, res) => {
    const { id, email, role, name } = req.body;
    if (!id || !email || !role) return res.status(400).json({ message: "id, email, and role are required" });

    const user = { id, email, role, name: name || "Dev User" };
    return res.json({ accessToken: buildAccessToken(user), refreshToken: buildRefreshToken(user) });
  });
}

export default router;
