const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const categoriesRoutes = require("./routes/categories");
const productsRouter = require("./routes/products");
const paymentMethodsRouter = require("./routes/paymentMethods");
const posConfigRouter = require("./routes/posConfig");
const taxRatesRouter = require("./routes/taxRates");
const kitchenRouter = require("./routes/kitchen");
const customersRouter = require("./routes/customers");
const ordersRouter = require("./routes/orders");
const posTerminalRouter = require("./routes/posTerminal");
const customerDisplayRouter = require("./routes/customerDisplay");
const reportsRouter = require("./routes/reports");

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
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRouter);
app.use("/api/payment-methods", paymentMethodsRouter);
app.use("/api/pos-config", posConfigRouter);
app.use("/api/tax-rates", taxRatesRouter);
app.use("/api/kitchen", kitchenRouter);
app.use("/api/customers", customersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/pos-terminal", posTerminalRouter);
app.use("/api/customer-display", customerDisplayRouter);
app.use("/api/reports", reportsRouter);

app.get("/", (_req, res) => {
  res.json({
    project: "Odoo POS Cafe",
    phase: 1,
    message: "Backend foundation is ready.",
  });
});

module.exports = app;
