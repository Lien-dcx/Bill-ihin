require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const authRoutes = require("./routes/auth");
const householdRoutes = require("./routes/household");
const memberRoutes = require("./routes/members");
const categoryRoutes = require("./routes/categories");
const billRoutes = require("./routes/bills");
const budgetRoutes = require("./routes/budgets");
const contributionRoutes = require("./routes/contributions");
const assignmentRoutes = require("./routes/assignments");
const paymentRoutes = require("./routes/payments");
const notificationRoutes = require("./routes/notifications");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "32kb" }));
app.use((_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  next();
});

app.get("/api/health", async (_req, res) => {
  await db.execute("SELECT 1");
  res.json({ message: "Bill-ihin API is running", database: "connected" });
});

app.use("/api/auth", authRoutes);
app.use("/api/household", householdRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

// Keep NovaMart's existing product/order endpoints available for its existing screens.
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));
app.use((error, _req, res, _next) => {
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must contain valid JSON." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }
  console.error(error);
  return res.status(500).json({ message: "The request could not be completed." });
});

if (require.main === module) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Set JWT_SECRET to a random value of at least 32 characters.");
  }
  const port = Number(process.env.PORT) || 5000;
  const server = app.listen(port, () => console.log(`Bill-ihin API listening on port ${port}`));
  const shutdown = () => server.close(() => db.end().finally(() => process.exit(0)));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

module.exports = app;
