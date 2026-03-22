import express from "express";
import { evaluateAnswerController, aiHealthController } from "../controllers/aiController.js";
import { verifyJWT, trackApiUsage } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/health", aiHealthController);

// Protect the route and track usage limits
router.post("/evaluate", verifyJWT, trackApiUsage, evaluateAnswerController);

export default router;
