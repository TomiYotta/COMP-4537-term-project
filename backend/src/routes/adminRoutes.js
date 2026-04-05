import { readPool } from "../config/db.js";

export async function getAllUsers(req, res) {
  try {
    const [users] = await readPool.execute(
      "SELECT id, first_name, last_name, email, role, api_calls, created_at FROM users ORDER BY created_at DESC"
    );
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
}

export async function getSystemUsage(req, res) {
  try {
    const [rows] = await readPool.execute("SELECT SUM(api_calls) as total_calls FROM users");
    res.status(200).json({ 
      totalApiCalls: rows[0].total_calls || 0 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch usage metrics." });
  }
}