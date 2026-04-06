import path from "path";
import { fileURLToPath } from "url";
import { evaluateAnswer, getModelInfo } from "../services/aiService.js";
import { readPool } from "../config/db.js"; // Import the read pool to securely fetch room data
import { recordStudentResponse } from "../services/roomSessionStore.js";

const MAX_LENGTH = 2000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoHtmlPath = path.resolve(__dirname, "../public/demo.html");
const demoCssPath = path.resolve(__dirname, "../public/demo.css");
const demoJsPath = path.resolve(__dirname, "../public/demo.js");

function validateTextField(fieldName, value) {
  if (typeof value !== "string") {
    return `${fieldName} must be a string.`;
  }

  if (value.trim().length === 0) {
    return `${fieldName} cannot be empty.`;
  }

  if (value.length > MAX_LENGTH) {
    return `${fieldName} must be ${MAX_LENGTH} characters or less.`;
  }

  return null;
}

export async function evaluateAnswerController(req, res) {
  try {
    // We now expect the roomCode instead of the referenceAnswer
    const { roomCode, studentAnswer } = req.body;

    if (!roomCode) {
      return res.status(400).json({ error: "roomCode is required." });
    }

    if (roomCode === "DEMO123") {
      const demoQuestion = "What is the primary purpose of a database index?";
      const demoSample = "To speed up data retrieval operations on a table.";

      const result = await evaluateAnswer({
        question: demoQuestion,
        referenceAnswer: demoSample,
        studentAnswer: studentAnswer
      });

      return res.status(200).json({ 
        message: "Demo Mode Active (Bypassed DB)", 
        ...result 
      });
    }

    const studentError = validateTextField("studentAnswer", studentAnswer);
    if (studentError) {
      return res.status(400).json({ error: studentError });
    }

    // 1. Securely fetch the active question and teacher's reference answer from the database
    const [roomRows] = await readPool.execute(
      "SELECT current_question, sample_answer FROM rooms WHERE room_code = ?",
      [roomCode]
    );

    if (roomRows.length === 0) {
      return res.status(404).json({ error: "Invalid room code or session has ended." });
    }

    const { current_question, sample_answer } = roomRows[0];

    if (!current_question || !sample_answer) {
      return res.status(400).json({ error: "No active question has been asked in this room yet." });
    }

    // 2. Evaluate the student's answer against the securely fetched database reference
    const result = await evaluateAnswer({
      question: current_question,
      referenceAnswer: sample_answer,
      studentAnswer: studentAnswer
    });

    const [userRows] = await readPool.execute(
      "SELECT first_name, last_name FROM users WHERE id = ?",
      [req.user.id]
    );
    const userRecord = userRows[0];

    recordStudentResponse(roomCode, {
      studentId: req.user.id,
      studentName: userRecord
        ? `${userRecord.first_name} ${userRecord.last_name?.trim() || ""}`.trim()
        : `Student ${req.user.id}`,
      answer: result.studentAnswer,
      question: current_question,
      verdict: result.verdict,
      similarity: result.similarity,
      feedback: result.feedback
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("AI evaluation error:", error);
    return res.status(500).json({
      error: "Failed to evaluate answer."
    });
  }
}

export function aiHealthController(req, res) {
  return res.status(200).json({
    status: "ok",
    ...getModelInfo()
  });
}

export function aiDemoCssController(req, res) {
  return res.type("text/css").sendFile(demoCssPath);
}

export function aiDemoJsController(req, res) {
  return res.type("application/javascript").sendFile(demoJsPath);
}

export function aiDemoController(req, res) {
  // Serve the demo as static files and keep a strict CSP.
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self';"
  );

  return res.status(200).type("text/html").sendFile(demoHtmlPath);
}
