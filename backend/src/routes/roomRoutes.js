import express from "express";
import {
  createRoom,
  askQuestion,
  getActiveQuestion,
  closeRoom,
  joinRoom,
  getRoomDashboard
} from "../controllers/roomController.js";
import { verifyJWT, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Teacher strictly endpoints
router.post("/create", verifyJWT, requireRole(['teacher', 'admin']), createRoom);
router.post("/ask", verifyJWT, requireRole(['teacher', 'admin']), askQuestion);
router.get("/dashboard/:roomCode", verifyJWT, requireRole(['teacher', 'admin']), getRoomDashboard);
router.delete("/close/:roomCode", verifyJWT, requireRole(['teacher', 'admin']), closeRoom);

// Student endpoints
router.post("/join", verifyJWT, joinRoom);
router.get("/active/:roomCode", verifyJWT, getActiveQuestion);

export default router;
