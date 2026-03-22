import jwt from "jsonwebtoken";
import { readPool, writePool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";

// Verifies the JWT token from the Authorization header
export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attaches user payload to request
    next();
  } catch (error) {
    return res.status(403).json({ error: "Forbidden: Invalid or expired token." });
  }
};

// Tracks and limits API usage
export const trackApiUsage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const [users] = await readPool.execute("SELECT api_calls FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return res.status(404).json({ error: "User not found." });

    const currentCalls = users[0].api_calls;

    if (currentCalls >= 20) {
      // Assignment req: warn client but continue functioning
      res.setHeader('X-API-Warning', 'API call limit (20) reached. Please upgrade.');
    }

    await writePool.execute("UPDATE users SET api_calls = api_calls + 1 WHERE id = ?", [userId]);
    
    next();
  } catch (error) {
    console.error("API tracking error:", error);
    next(); // Don't block the request if tracking fails
  }
};