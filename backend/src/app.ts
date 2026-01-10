import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import leaveRequestRoutes from "./routes/leave-request.routes";
import adminRoutes from "./routes/admin.routes";
import { apiLimiter } from "./middleware/rateLimiter";

dotenv.config();

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ Only rate limit in non-test env (Cypress should run with NODE_ENV=test)
if (process.env.NODE_ENV !== "test") {
  app.use(apiLimiter);
}

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
