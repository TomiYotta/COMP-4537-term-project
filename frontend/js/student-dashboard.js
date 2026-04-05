const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = isLocal
  ? "http://localhost:3000"
  : "https://comp-4537-term-project.onrender.com";

const STORAGE_KEYS = {
  activeRoomCode: "activeRoomCode",
  currentQuestionText: "currentQuestionText",
  lastAnsweredQuestionText: "lastAnsweredQuestionText",
  answeredCount: "answeredCount",
  correctCount: "correctCount",
  answerHistory: "answerHistory"
};

let activeRoomCode = sessionStorage.getItem(STORAGE_KEYS.activeRoomCode) || "";
let currentQuestionText = sessionStorage.getItem(STORAGE_KEYS.currentQuestionText) || "";
let lastAnsweredQuestionText = sessionStorage.getItem(STORAGE_KEYS.lastAnsweredQuestionText) || "";
let answered = Number(sessionStorage.getItem(STORAGE_KEYS.answeredCount) || 0);
let correct = Number(sessionStorage.getItem(STORAGE_KEYS.correctCount) || 0);
let answerHistory = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.answerHistory) || "[]");
let pollIntervalId = null;
let isPolling = false;
let isRecoveringRoom = false;
let resultResetTimeoutId = null;

const roomCodeDisplay = document.getElementById("room-code-display");
const questionCard = document.getElementById("question-card");
const questionTextNode = document.getElementById("question-text");
const answerArea = document.getElementById("answer-area");
const resultArea = document.getElementById("result-area");
const resultBox = document.getElementById("result-box");
const resultLabel = document.getElementById("result-label");
const resultFeedback = document.getElementById("result-feedback");
const waitingCard = document.getElementById("waiting-card");
const waitingTitle = document.getElementById("waiting-title");
const waitingText = document.getElementById("waiting-text");
const answerInput = document.getElementById("answer-input");
const submitButton = document.getElementById("submit-btn");
const historyList = document.getElementById("history-list");

if (user.firstName) {
  document.getElementById("welcome-name").textContent = user.firstName;
}

function setStoredString(key, value) {
  if (value) {
    sessionStorage.setItem(key, value);
    return;
  }

  sessionStorage.removeItem(key);
}

function redirectToAuth(message = "Your session has expired. Please log in again.") {
  alert(message);
  window.location.href = "Auth.html";
}

function getLiveQuestion(data) {
  return typeof data.question === "string" ? data.question.trim() : "";
}

function handleAuthFailure(response, data) {
  if (response.status !== 401 && response.status !== 403) {
    return false;
  }

  redirectToAuth(data.error);
  return true;
}

function syncRoomState(roomCode, data, { resetProgress = false, resetAnsweredQuestion = false } = {}) {
  activeRoomCode = roomCode;

  if (resetAnsweredQuestion) {
    resetQuestionState();
  }

  if (resetProgress) {
    resetProgressState();
  }

  const liveQuestion = getLiveQuestion(data);
  if (liveQuestion) {
    currentQuestionText = liveQuestion;
  }

  persistStudentState();
  updateRoomDisplay();

  if (currentQuestionText && currentQuestionText !== lastAnsweredQuestionText) {
    showQuestion(currentQuestionText);
  } else {
    showWaiting();
  }

  return true;
}

function clearRoomSession() {
  activeRoomCode = "";
  resetQuestionState();
  resetProgressState();
  updateRoomDisplay();
}

function persistStudentState() {
  sessionStorage.setItem(STORAGE_KEYS.answeredCount, String(answered));
  sessionStorage.setItem(STORAGE_KEYS.correctCount, String(correct));
  sessionStorage.setItem(STORAGE_KEYS.answerHistory, JSON.stringify(answerHistory));
  setStoredString(STORAGE_KEYS.activeRoomCode, activeRoomCode);
  setStoredString(STORAGE_KEYS.currentQuestionText, currentQuestionText);
  setStoredString(STORAGE_KEYS.lastAnsweredQuestionText, lastAnsweredQuestionText);
}

function renderStats() {
  document.getElementById("stat-answered").textContent = answered;
  document.getElementById("stat-correct").textContent = correct;
  document.getElementById("stat-score").textContent = answered
    ? `${Math.round((correct / answered) * 100)}%`
    : "--";
}

function buildHistoryEntry(entry) {
  const row = document.createElement("div");
  row.className = "flex items-start justify-between gap-2 border-b border-dashed border-[#ddd] pb-2";

  const left = document.createElement("div");
  left.className = "flex-1";

  const question = document.createElement("p");
  question.className = "font-caveat text-xs text-[#888] mb-0.5";
  question.textContent = entry.question.length > 50
    ? `${entry.question.slice(0, 50)}...`
    : entry.question;

  const answer = document.createElement("p");
  answer.className = "text-sm text-[#1a1a1a]";
  answer.textContent = entry.answer;

  left.appendChild(question);
  left.appendChild(answer);

  const badge = document.createElement("span");
  badge.className = `font-caveat text-xs font-bold px-2 py-0.5 rounded-sm border-[1.5px] whitespace-nowrap ${
    entry.isCorrect
      ? "border-[#4caf7d] text-[#4caf7d]"
      : "border-[#e05a5a] text-[#e05a5a]"
  }`;
  badge.textContent = `${entry.isCorrect ? "OK" : "NO"} ${entry.matchPercent}% Match`;

  row.appendChild(left);
  row.appendChild(badge);

  return row;
}

function renderHistory() {
  historyList.replaceChildren();

  if (!answerHistory.length) {
    const empty = document.createElement("p");
    empty.className = "text-sm text-[#aaa] italic";
    empty.id = "no-history-msg";
    empty.textContent = "No answers submitted yet.";
    historyList.appendChild(empty);
    return;
  }

  answerHistory.forEach((entry) => {
    historyList.appendChild(buildHistoryEntry(entry));
  });
}

function resetProgressState() {
  answered = 0;
  correct = 0;
  answerHistory = [];
  persistStudentState();
  renderStats();
  renderHistory();
}

function resetQuestionState() {
  currentQuestionText = "";
  lastAnsweredQuestionText = "";
  if (resultResetTimeoutId) {
    window.clearTimeout(resultResetTimeoutId);
    resultResetTimeoutId = null;
  }
  persistStudentState();
}

function updateRoomDisplay() {
  roomCodeDisplay.textContent = activeRoomCode || "------";
}

function showWaiting(
  title = "Waiting for next question...",
  description = "Your teacher will send a question shortly."
) {
  questionCard.classList.add("hidden");
  waitingCard.classList.remove("hidden");
  waitingTitle.textContent = title;
  waitingText.textContent = description;
}

function showQuestion(question) {
  if (resultResetTimeoutId) {
    window.clearTimeout(resultResetTimeoutId);
    resultResetTimeoutId = null;
  }

  currentQuestionText = question;
  persistStudentState();

  questionTextNode.textContent = question;
  answerInput.value = "";
  answerArea.classList.remove("hidden");
  resultArea.classList.add("hidden");
  questionCard.classList.remove("hidden");
  waitingCard.classList.add("hidden");
  submitButton.disabled = false;
  submitButton.textContent = "Submit Answer ->";
}

async function fetchRoomState(roomCode) {
  const response = await fetch(`${BASE_URL}/api/rooms/active/${roomCode}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function joinRoomSession(roomCode) {
  const response = await fetch(`${BASE_URL}/api/rooms/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ roomCode })
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function promptForValidRoomCode(promptMessage = "Enter the 6-digit teacher code:") {
  let nextPrompt = promptMessage;

  while (true) {
    const input = window.prompt(nextPrompt, activeRoomCode || "");
    if (input === null) {
      showWaiting("Room code required", "Use the Change Room button when you are ready to join a class.");
      return false;
    }

    const roomCode = input.replace(/\D/g, "").slice(0, 6);
    if (!/^\d{6}$/.test(roomCode)) {
      nextPrompt = "Please enter a valid 6-digit teacher code.";
      continue;
    }

    let roomState;
    try {
      roomState = await joinRoomSession(roomCode);
    } catch (error) {
      alert(`Unable to verify the room code: ${error.message}`);
      return false;
    }

    const { response, data } = roomState;

    if (handleAuthFailure(response, data)) {
      return false;
    }

    if (response.ok) {
      return syncRoomState(roomCode, data, {
        resetProgress: true,
        resetAnsweredQuestion: true
      });
    }

    nextPrompt = data.error || "That room code is not active. Try again.";
  }
}

async function initializeRoomSession() {
  updateRoomDisplay();

  if (!activeRoomCode) {
    return promptForValidRoomCode();
  }

  let roomState;
  try {
    roomState = await joinRoomSession(activeRoomCode);
  } catch (error) {
    showWaiting("Unable to reach the server", error.message);
    return false;
  }

  const { response, data } = roomState;

  if (handleAuthFailure(response, data)) {
    return false;
  }

  if (!response.ok) {
    clearRoomSession();
    return promptForValidRoomCode("Your previous room is no longer active. Enter a new 6-digit teacher code:");
  }

  return syncRoomState(activeRoomCode, data);
}

function stopPolling() {
  if (pollIntervalId) {
    window.clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}

function startPolling() {
  stopPolling();
  pollIntervalId = window.setInterval(() => {
    pollForQuestions();
  }, 3000);
  pollForQuestions();
}

async function recoverFromClosedRoom(message) {
  if (isRecoveringRoom) return;

  isRecoveringRoom = true;
  stopPolling();
  clearRoomSession();

  alert(`${message} Enter a new room code to keep going.`);
  const joined = await promptForValidRoomCode("Enter a new 6-digit teacher code:");

  if (joined) {
    startPolling();
  }

  isRecoveringRoom = false;
}

async function pollForQuestions() {
  if (isPolling || !activeRoomCode || isRecoveringRoom) return;

  isPolling = true;

  try {
    const { response, data } = await fetchRoomState(activeRoomCode);

    if (response.status === 404) {
      await recoverFromClosedRoom(data.error || "This room has ended.");
      return;
    }

    if (handleAuthFailure(response, data)) {
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch the latest question.");
    }

    const nextQuestion = typeof data.question === "string" ? data.question.trim() : "";

    if (!nextQuestion) {
      if (!currentQuestionText || currentQuestionText === lastAnsweredQuestionText) {
        showWaiting();
      }
      return;
    }

    if (nextQuestion !== currentQuestionText) {
      currentQuestionText = nextQuestion;
      persistStudentState();

      if (nextQuestion !== lastAnsweredQuestionText) {
        showQuestion(nextQuestion);
      }
    }
  } catch (error) {
    console.error("Polling error:", error);
  } finally {
    isPolling = false;
  }
}

async function changeRoom() {
  stopPolling();
  clearRoomSession();

  const joined = await promptForValidRoomCode("Enter a new 6-digit teacher code:");
  if (joined) {
    startPolling();
  }
}

async function submitAnswer() {
  const answer = answerInput.value.trim();
  if (!answer) return;

  const questionText = questionTextNode.textContent.trim();

  submitButton.disabled = true;
  submitButton.textContent = "AI Evaluating...";

  try {
    const res = await fetch(`${BASE_URL}/api/ai/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        roomCode: activeRoomCode,
        studentAnswer: answer
      })
    });

    if (res.headers.has("X-API-Warning")) {
      alert(`API LIMIT WARNING: ${res.headers.get("X-API-Warning")}`);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to evaluate answer");

    const isCorrect = data.verdict === "correct" || data.verdict === "partially_correct";

    answerArea.classList.add("hidden");
    resultArea.classList.remove("hidden");

    if (isCorrect) {
      resultBox.className = "border-[2px] rounded-sm p-3 border-[#4caf7d] bg-[#f0fff4]";
      resultLabel.textContent = data.verdict === "correct" ? "Correct!" : "Partially Correct";
      resultLabel.style.color = "#4caf7d";
      resultFeedback.textContent = data.feedback;
      correct++;
    } else {
      resultBox.className = "border-[2px] rounded-sm p-3 border-[#e05a5a] bg-[#fff5f5]";
      resultLabel.textContent = "Not quite.";
      resultLabel.style.color = "#e05a5a";
      resultFeedback.textContent = data.feedback;
    }

    answered++;
    lastAnsweredQuestionText = questionText;
    answerHistory.unshift({
      question: questionText,
      answer,
      isCorrect,
      matchPercent: Math.round(data.similarity * 100)
    });

    persistStudentState();
    renderHistory();
    renderStats();

    resultResetTimeoutId = window.setTimeout(() => {
      showWaiting();
    }, 5000);
  } catch (error) {
    alert(`Error evaluating answer: ${error.message}`);
    submitButton.disabled = false;
    submitButton.textContent = "Submit Answer ->";
  }
}

renderStats();
renderHistory();
updateRoomDisplay();
showWaiting();

initializeRoomSession()
  .then((joinedRoom) => {
    if (joinedRoom) {
      startPolling();
    }
  })
  .catch((error) => {
    console.error("Student dashboard init error:", error);
    showWaiting("Unable to join room", error.message);
  });
