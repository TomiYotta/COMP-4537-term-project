import express from "express";
import {
	evaluateAnswerController,
	aiHealthController,
	aiDemoController,
	aiDemoCssController
} from "../controllers/aiController.js";
import { verifyJWT, trackApiUsage } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/health", aiHealthController);
router.get("/demo.css", aiDemoCssController);
router.get("/demo", aiDemoController);
router.post("/demo", evaluateAnswerController);

// Protect the route and track usage limits
router.post("/evaluate", verifyJWT, trackApiUsage, evaluateAnswerController);

export default router;
