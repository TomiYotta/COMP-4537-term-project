import express from "express";
import { getAllUsers, getSystemUsage } from "../controllers/adminController.js";
import { verifyJWT, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/users", verifyJWT, requireRole(["admin"]), getAllUsers);
router.get("/usage", verifyJWT, requireRole(["admin"]), getSystemUsage);

export default router;
