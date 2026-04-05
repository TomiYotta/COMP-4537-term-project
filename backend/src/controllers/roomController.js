import { writePool, readPool } from "../config/db.js";
import {
  closeRoomSession,
  getRoomDashboardSnapshot,
  openRoomSession,
  registerParticipant,
  setActiveQuestion
} from "../services/roomSessionStore.js";

export async function createRoom(req, res) {
  try {
    const teacherId = req.user.id;
    // Generate random 6 digit code
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString(); 

    await writePool.execute(
      "INSERT INTO rooms (teacher_id, room_code) VALUES (?, ?)",
      [teacherId, roomCode]
    );

    openRoomSession(roomCode, teacherId);

    res.status(201).json({ message: "Room created", roomCode });
  } catch (error) {
    res.status(500).json({ error: "Failed to create room." });
  }
}

export async function askQuestion(req, res) {
  try {
    const teacherId = req.user.id;
    const { roomCode, question, sampleAnswer } = req.body;

    if (!question || !sampleAnswer) {
      return res.status(400).json({ error: "Question and sample answer are required." });
    }

    const [result] = await writePool.execute(
      "UPDATE rooms SET current_question = ?, sample_answer = ? WHERE room_code = ? AND teacher_id = ?",
      [question, sampleAnswer, roomCode, teacherId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Room not found or unauthorized." });

    openRoomSession(roomCode, teacherId);
    setActiveQuestion(roomCode, question);

    res.status(200).json({ message: "Question broadcasted to room." });
  } catch (error) {
    res.status(500).json({ error: "Failed to update question." });
  }
}

export async function joinRoom(req, res) {
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({ error: "roomCode is required." });
    }

    const [roomRows] = await readPool.execute(
      "SELECT room_code, current_question FROM rooms WHERE room_code = ?",
      [roomCode]
    );

    if (roomRows.length === 0) {
      return res.status(404).json({ error: "Invalid room code." });
    }

    const [userRows] = await readPool.execute(
      "SELECT first_name, last_name FROM users WHERE id = ?",
      [req.user.id]
    );

    const userRecord = userRows[0];
    registerParticipant(roomCode, {
      id: req.user.id,
      name: userRecord
        ? `${userRecord.first_name} ${userRecord.last_name?.trim() || ""}`.trim()
        : `Student ${req.user.id}`
    });

    const snapshot = getRoomDashboardSnapshot(roomCode);

    res.status(200).json({
      roomCode,
      question: roomRows[0].current_question || "",
      participantCount: snapshot.participantCount
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to join room." });
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

export async function getRoomDashboard(req, res) {
  try {
    const teacherId = req.user.id;
    const { roomCode } = req.params;

    const [roomRows] = await readPool.execute(
      "SELECT room_code, current_question FROM rooms WHERE room_code = ? AND teacher_id = ?",
      [roomCode, teacherId]
    );

    if (roomRows.length === 0) {
      return res.status(404).json({ error: "NO ROOM FOUND." });
    }

    openRoomSession(roomCode, teacherId);
    const snapshot = getRoomDashboardSnapshot(roomCode);

    res.status(200).json({
      ...snapshot,
      currentQuestion: roomRows[0].current_question || snapshot.currentQuestion || ""
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch room dashboard." });
  }
}

export async function closeRoom(req, res) {
  try {
    const teacherId = req.user.id;
    const { roomCode } = req.params;

    await writePool.execute("DELETE FROM rooms WHERE room_code = ? AND teacher_id = ?", [roomCode, teacherId]);
    closeRoomSession(roomCode);
    res.status(200).json({ message: "Room closed successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to close room." });
  }
}
