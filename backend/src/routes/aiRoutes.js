import express from "express";
import {
  evaluateAnswerController,
  aiHealthController
} from "../controllers/aiController.js";

const router = express.Router();

// Later, auth teammate can protect this route with JWT middleware:
// router.post("/evaluate", verifyJWT, evaluateAnswerController);

router.get("/health", aiHealthController);
router.post("/evaluate", evaluateAnswerController);

export default router;