const crypto = require("crypto");

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function extractRefreshToken(req) {
  if (req.cookies && req.cookies.refresh_token) {
    return req.cookies.refresh_token;
  }

  if (req.headers["x-refresh-token"]) {
    return req.headers["x-refresh-token"];
  }

  return null;
}

module.exports = {
  hashRefreshToken,
  extractRefreshToken,
};
