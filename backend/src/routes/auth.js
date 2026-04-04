const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { supabaseAdmin } = require("../config/supabase");
const { buildAccessToken, buildRefreshToken } = require("../utils/token");
const { requireAuth } = require("../middleware/auth");
const { extractRefreshToken, hashRefreshToken } = require("../middleware/refreshToken");

const router = express.Router();
const refreshCookieName = "refresh_token";

function describeDbError(error, fallback = "Unknown database error") {
  if (!error) {
    return fallback;
  }

  return error.message || error.hint || error.details || fallback;
}

function setRefreshCookie(res, refreshToken, expiresAt) {
  const maxAge = Math.max(1, expiresAt.getTime() - Date.now());

  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge,
  });
}

async function getRoleIdByCode(code) {
  const { data: role, error } = await supabaseAdmin
    .from("roles")
    .select("id, code")
    .eq("code", code)
    .maybeSingle();

  if (error || !role) {
    throw new Error(`Role not found for code: ${code}`);
  }

  return role.id;
}

async function getRoleCodeById(roleId) {
  const { data: role, error } = await supabaseAdmin
    .from("roles")
    .select("code")
    .eq("id", roleId)
    .maybeSingle();

  if (error || !role) {
    throw new Error("Failed to resolve user role");
  }

  return role.code;
}

function getRefreshExpiry(refreshToken) {
  const decoded = jwt.decode(refreshToken);
  if (!decoded || typeof decoded !== "object" || typeof decoded.exp !== "number") {
    throw new Error("Invalid refresh token expiry payload");
  }

  return new Date(decoded.exp * 1000);
}

async function persistRefreshToken(userId, refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshExpiry(refreshToken);

  const { error } = await supabaseAdmin.from("refresh_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    revoked: false,
  });

  if (error) {
    throw new Error(`Failed to persist refresh token: ${error.message}`);
  }

  return expiresAt;
}

async function issueSession(user) {
  const accessToken = buildAccessToken(user);
  const refreshToken = buildRefreshToken(user);
  const refreshExpiresAt = await persistRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt,
  };
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const { count, error: countError } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true });

    if (countError) {
      throw new Error(`Unable to determine user count: ${describeDbError(countError)}`);
    }

    const roleCode = (count || 0) === 0 ? "admin" : "cashier";
    const roleId = await getRoleIdByCode(roleCode);
    const passwordHash = await bcrypt.hash(String(password), 10);

    const { data: createdUser, error: createError } = await supabaseAdmin
      .from("users")
      .insert({
        role_id: roleId,
        name: String(name).trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
      })
      .select("id, name, email")
      .single();

    if (createError || !createdUser) {
      throw new Error(`Failed to create user: ${describeDbError(createError, "Unknown error")}`);
    }

    const user = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: roleCode,
    };

    const session = await issueSession(user);
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);

    return res.status(201).json({
      accessToken: session.accessToken,
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: userRow, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, password_hash, role_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error || !userRow) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(String(password), userRow.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const roleCode = await getRoleCodeById(userRow.role_id);

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: roleCode,
    };

    const session = await issueSession(user);
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);

    return res.json({
      accessToken: session.accessToken,
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Login failed" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
    if (!decoded || decoded.type !== "refresh") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const { data: storedToken, error } = await supabaseAdmin
      .from("refresh_tokens")
      .select("id, user_id, revoked, expires_at")
      .eq("token_hash", tokenHash)
      .eq("user_id", decoded.sub)
      .maybeSingle();

    if (error || !storedToken || storedToken.revoked) {
      return res.status(401).json({ message: "Refresh token not recognized" });
    }

    if (new Date(storedToken.expires_at).getTime() <= Date.now()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    await supabaseAdmin.from("refresh_tokens").update({ revoked: true }).eq("id", storedToken.id);

    const { data: userRow, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role_id")
      .eq("id", storedToken.user_id)
      .maybeSingle();

    if (userError || !userRow) {
      return res.status(401).json({ message: "User not found for refresh token" });
    }

    const roleCode = await getRoleCodeById(userRow.role_id);
    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: roleCode,
    };

    const session = await issueSession(user);
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);

    return res.json({
      accessToken: session.accessToken,
      user,
    });
  } catch (_error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = extractRefreshToken(req);

  if (refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    await supabaseAdmin.from("refresh_tokens").update({ revoked: true }).eq("token_hash", tokenHash);
  }

  res.clearCookie(refreshCookieName);
  return res.status(204).send();
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

router.post("/dev-token", (req, res) => {
  const { id, email, role, name } = req.body || {};

  if (!id || !email || !role) {
    return res.status(400).json({ message: "id, email, and role are required" });
  }

  const user = { id, email, role, name: name || "Dev User" };

  return res.json({
    accessToken: buildAccessToken(user),
    refreshToken: buildRefreshToken(user),
  });
});

module.exports = router;
