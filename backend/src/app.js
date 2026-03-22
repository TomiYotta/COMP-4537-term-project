import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js";
import { warmupModel } from "./services/aiService.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json({ limit: "50kb" }));

app.get("/", (req, res) => {
  res.json({
    message: "AI service is running."
  });
});

app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    const info = await warmupModel();
    console.log("Model warmed up successfully.");
    console.log(`Model: ${info.model}`);
    console.log(`Cache directory: ${info.cacheDir}`);
  } catch (error) {
    console.error("Model warmup failed:", error.message);
  }
});