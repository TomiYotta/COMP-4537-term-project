import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { writePool } from "../config/db.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";

export async function register(req, res) {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const [existing] = await writePool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await writePool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [firstName, lastName, email, hashedPassword, role]
    );

    res.status(201).json({ message: "Account created successfully." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const [users] = await writePool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const [users] = await writePool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    await writePool.execute(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [token, expires, user.id]
    );

    const isLocal = process.env.NODE_ENV !== "production";
    const resetLink = isLocal
      ? `http://127.0.0.1:5500/frontend/reset-password.html?token=${token}`
      : `https://your-live-frontend-url.com/reset-password.html?token=${token}`;

    await sendPasswordResetEmail(email, resetLink);

    res.status(200).json({ message: "Reset email sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Server error during password reset." });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const [users] = await writePool.execute(
      "SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const user = users[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await writePool.execute(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Server error during password reset." });
  }
}
