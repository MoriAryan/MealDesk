import jwt from "jsonwebtoken";
import env from "../config/env.js";

export function buildAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
      email: user.email,
      name: user.name,
    },
    env.jwt.accessSecret,
    {
      subject: user.id,
      expiresIn: env.jwt.accessTtl,
    }
  );
}

export function buildRefreshToken(user) {
  return jwt.sign(
    {
      type: "refresh",
    },
    env.jwt.refreshSecret,
    {
      subject: user.id,
      expiresIn: env.jwt.refreshTtl,
    }
  );
}
