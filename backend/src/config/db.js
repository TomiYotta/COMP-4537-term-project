import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Read Pool - Uses 'user' account for SELECT queries
export const readPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_USER_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false } 
});

// Write Pool - Uses 'admin' account for INSERT/UPDATE/DELETE queries
export const writePool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_ADMIN,
  password: process.env.DB_ADMIN_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }
});