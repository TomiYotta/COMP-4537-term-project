import { evaluateAnswer, getModelInfo } from "../services/aiService.js";

const MAX_LENGTH = 2000;

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
    const { question, referenceAnswer, studentAnswer } = req.body;

    const referenceError = validateTextField("referenceAnswer", referenceAnswer);
    if (referenceError) {
      return res.status(400).json({ error: referenceError });
    }

    const studentError = validateTextField("studentAnswer", studentAnswer);
    if (studentError) {
      return res.status(400).json({ error: studentError });
    }

    if (question !== undefined && typeof question !== "string") {
      return res.status(400).json({ error: "question must be a string if provided." });
    }

    const result = await evaluateAnswer({
      question,
      referenceAnswer,
      studentAnswer
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