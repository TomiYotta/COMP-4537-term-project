import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet"; 
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { warmupModel } from "./services/aiService.js";

dotenv.config();

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN, "http://localhost:5173", "http://localhost:5500", "http://127.0.0.1:5500"].filter(Boolean),
    credentials: true,
    exposedHeaders: ['X-API-Warning'] 
  })
);

app.use(express.json({ limit: "50kb" }));

app.get("/", (req, res) => {
  res.json({ message: "AI service is running securely." });
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    const info = await warmupModel();
    console.log("Model warmed up successfully.");
    console.log(`Model: ${info.model}`);
  } catch (error) {
    console.error("Model warmup failed:", error.message);
  }
});