import crypto from "crypto";

export function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function extractRefreshToken(req) {
  if (req.cookies && req.cookies.refresh_token) {
    return req.cookies.refresh_token;
  }

  if (req.headers["x-refresh-token"]) {
    return req.headers["x-refresh-token"];
  }

  return null;
}
