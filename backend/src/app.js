import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
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
import floorsRouter from "./routes/floors.js";
import tablesRouter from "./routes/tables.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
});

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 100, // limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please slow down.",
  },
});

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(helmet());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/auth", authLimiter, authRoutes);

app.use("/api", globalLimiter);
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
app.use("/api/floors", floorsRouter);
app.use("/api/tables", tablesRouter);

app.get("/", (_req, res) => {
  res.json({
    project: "Odoo POS Cafe",
    phase: 1,
    message: "Backend foundation is ready.",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
