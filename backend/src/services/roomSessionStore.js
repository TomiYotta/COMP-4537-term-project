const roomSessions = new Map();

function ensureRoomSession(roomCode) {
  if (!roomSessions.has(roomCode)) {
    roomSessions.set(roomCode, {
      teacherId: null,
      currentQuestion: "",
      questionVersion: 0,
      participants: new Map(),
      responses: new Map()
    });
  }

  return roomSessions.get(roomCode);
}

export function openRoomSession(roomCode, teacherId) {
  const session = ensureRoomSession(roomCode);
  session.teacherId = teacherId;
  return session;
}

export function closeRoomSession(roomCode) {
  roomSessions.delete(roomCode);
}

export function registerParticipant(roomCode, participant) {
  const session = ensureRoomSession(roomCode);
  const existing = session.participants.get(participant.id);

  session.participants.set(participant.id, {
    ...participant,
    joinedAt: existing?.joinedAt || new Date().toISOString()
  });

  return session.participants.size;
}

export function setActiveQuestion(roomCode, question) {
  const session = ensureRoomSession(roomCode);
  session.currentQuestion = question;
  session.questionVersion += 1;
  session.responses = new Map();
}

export function recordStudentResponse(roomCode, response) {
  const session = ensureRoomSession(roomCode);

  if (!session.participants.has(response.studentId)) {
    session.participants.set(response.studentId, {
      id: response.studentId,
      name: response.studentName,
      joinedAt: new Date().toISOString()
    });
  }

  if (session.currentQuestion !== response.question) {
    session.currentQuestion = response.question;
    session.questionVersion += 1;
    session.responses = new Map();
  }

  session.responses.set(response.studentId, {
    ...response,
    submittedAt: new Date().toISOString()
  });
}

export function getRoomDashboardSnapshot(roomCode) {
  const session = ensureRoomSession(roomCode);
  const responses = Array.from(session.responses.values()).sort((left, right) =>
    right.submittedAt.localeCompare(left.submittedAt)
  );
  const participantCount = session.participants.size;
  const respondedCount = responses.length;
  const correctCount = responses.filter(
    (response) => response.verdict === "correct" || response.verdict === "partially_correct"
  ).length;

  return {
    participantCount,
    respondedCount,
    correctCount,
    incorrectCount: responses.length - correctCount,
    currentQuestion: session.currentQuestion,
    responses
  };
}
