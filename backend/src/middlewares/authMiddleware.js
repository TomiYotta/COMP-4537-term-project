import jwt from "jsonwebtoken";
import { readPool, writePool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";

export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ error: "Forbidden: Invalid or expired token." });
  }
};

// Role Checkers
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions." });
    }
    next();
  };
};

export const trackApiUsage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Fix: Use COALESCE to prevent NULL + 1 errors
    await writePool.execute("UPDATE users SET api_calls = COALESCE(api_calls, 0) + 1 WHERE id = ?", [userId]);
    
    const [users] = await readPool.execute("SELECT api_calls FROM users WHERE id = ?", [userId]);
    if (users.length > 0 && users[0].api_calls >= 20) {
      res.setHeader('X-API-Warning', 'API call limit (20) reached. Please upgrade.');
    }
    
    next();
  } catch (error) {
    console.error("API tracking error:", error);
    next(); 
  }
};