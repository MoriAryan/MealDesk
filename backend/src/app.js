const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (_req, res) => {
  res.json({
    project: "Odoo POS Cafe",
    phase: 1,
    message: "Backend foundation is ready.",
  });
});

module.exports = app;
