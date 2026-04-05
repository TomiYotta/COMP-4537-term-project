import { writePool, readPool } from "../config/db.js";

export async function createRoom(req, res) {
  try {
    const teacherId = req.user.id;
    // Generate random 6 digit code
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString(); 

    await writePool.execute(
      "INSERT INTO rooms (teacher_id, room_code) VALUES (?, ?)",
      [teacherId, roomCode]
    );

    res.status(201).json({ message: "Room created", roomCode });
  } catch (error) {
    res.status(500).json({ error: "Failed to create room." });
  }
}

export async function askQuestion(req, res) {
  try {
    const teacherId = req.user.id;
    const { roomCode, question, sampleAnswer } = req.body;

    const [result] = await writePool.execute(
      "UPDATE rooms SET current_question = ?, sample_answer = ? WHERE room_code = ? AND teacher_id = ?",
      [question, sampleAnswer, roomCode, teacherId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Room not found or unauthorized." });

    res.status(200).json({ message: "Question broadcasted to room." });
  } catch (error) {
    res.status(500).json({ error: "Failed to update question." });
  }
}

export async function getActiveQuestion(req, res) {
  try {
    const { roomCode } = req.params;
    const [rows] = await readPool.execute(
      "SELECT current_question, sample_answer FROM rooms WHERE room_code = ?", 
      [roomCode]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Invalid room code." });

    // We do NOT send the sample_answer back to the student frontend to prevent cheating.
    res.status(200).json({ question: rows[0].current_question });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch question." });
  }
}

export async function closeRoom(req, res) {
  try {
    const teacherId = req.user.id;
    const { roomCode } = req.params;

    await writePool.execute("DELETE FROM rooms WHERE room_code = ? AND teacher_id = ?", [roomCode, teacherId]);
    res.status(200).json({ message: "Room closed successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to close room." });
  }
}