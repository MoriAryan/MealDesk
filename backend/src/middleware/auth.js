const jwt = require("jsonwebtoken");
const env = require("../config/env");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name || null,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient role" });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRoles,
};
