import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import categoriesRoutes from "./routes/categories.js";
import productsRouter from "./routes/products.js";
import paymentMethodsRouter from "./routes/paymentMethods.js";
import posConfigRouter from "./routes/posConfig.js";
import taxRatesRouter from "./routes/taxRates.js";
import kitchenRouter from "./routes/kitchen.js";
import customersRouter from "./routes/customers.js";
import ordersRouter from "./routes/orders.js";
import posTerminalRouter from "./routes/posTerminal.js";
import customerDisplayRouter from "./routes/customerDisplay.js";
import reportsRouter from "./routes/reports.js";
import paymentsRouter from "./routes/payments.js";

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
app.use("/api/payments", paymentsRouter);

app.get("/", (_req, res) => {
  res.json({
    project: "Odoo POS Cafe",
    phase: 1,
    message: "Backend foundation is ready.",
  });
});

export default app;
