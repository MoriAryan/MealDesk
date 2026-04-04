const jwt = require("jsonwebtoken");
const env = require("../config/env");

function buildAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
      email: user.email,
    },
    env.jwt.accessSecret,
    {
      subject: user.id,
      expiresIn: env.jwt.accessTtl,
    }
  );
}

function buildRefreshToken(user) {
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

module.exports = {
  buildAccessToken,
  buildRefreshToken,
};
