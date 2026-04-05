const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = isLocal
  ? "http://localhost:3000"
  : "https://comp-4537-term-project.onrender.com";

let currentRoomCode = null;
let teacherPollIntervalId = null;

const roomCodeValue = document.getElementById("room-code");
const roomStatus = document.getElementById("room-status");
const questionInput = document.getElementById("question-input");
const referenceAnswerInput = document.getElementById("reference-answer-input");
const teacherDashboardLayout = document.getElementById("teacher-dashboard-layout");
const adminSection = document.getElementById("admin-section");
const sendQuestionButton = document.getElementById("send-question-btn");
const adminRefreshButton = document.getElementById("admin-refresh-btn");
const adminUsersList = document.getElementById("admin-users-list");
const adminTotalCalls = document.getElementById("admin-total-calls");
const adminUserCount = document.getElementById("admin-user-count");
const adminRoleBreakdown = document.getElementById("admin-role-breakdown");
const dashboardRoleLabel = document.getElementById("dashboard-role-label");
const pageHeading = document.querySelector("h1");
const responsesList = document.getElementById("responses-list");
const respondedCount = document.getElementById("responded-count");
const participationBar = document.getElementById("participation-bar");
const participationText = document.getElementById("participation-text");
const correctCount = document.getElementById("correct-count");
const wrongCount = document.getElementById("wrong-count");
const questionsList = document.getElementById("questions-list");
const activeBanner = document.getElementById("active-banner");
const activeQuestionText = document.getElementById("active-q-text");

if (user.firstName) {
  document.getElementById("welcome-name").textContent = user.firstName;
}

if (sendQuestionButton) {
  sendQuestionButton.textContent = "Send to Students ->";
}

function setSendQuestionButtonState(disabled, label = "Send to Students ->") {
  sendQuestionButton.disabled = disabled;
  sendQuestionButton.textContent = label;
}

function showActiveQuestion(question) {
  activeBanner.classList.remove("hidden");
  activeQuestionText.textContent = question;
}

function appendQuestionItem(question) {
  document.getElementById("no-questions-msg")?.remove();
  questionsList.appendChild(buildQuestionItem(question));
}

function getParticipantCount() {
  return Number(respondedCount.textContent.split("/")[1]?.trim() || 0);
}

function updateHeading(roleLabel) {
  if (dashboardRoleLabel) {
    dashboardRoleLabel.textContent = roleLabel;
    return;
  }

  if (pageHeading) {
    const name = user.firstName || (roleLabel === "Admin" ? "Admin" : "Teacher");
    pageHeading.textContent = `${name}'s ${roleLabel} Dashboard`;
  }
}

if (user.role === "admin") {
  document.title = "Admin Dashboard";
  updateHeading("Admin");
  teacherDashboardLayout.classList.add("hidden");
  adminSection.classList.remove("hidden");
} else {
  updateHeading("Teacher");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

async function initSession() {
  roomStatus.textContent = "Starting room...";
  setSendQuestionButtonState(true);

  try {
    const data = await fetchJson(`${BASE_URL}/api/rooms/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    currentRoomCode = data.roomCode;
    roomCodeValue.textContent = currentRoomCode;
    roomStatus.textContent = "Ready for students to join.";
    setSendQuestionButtonState(false);
    startTeacherPolling();
  } catch (error) {
    roomStatus.textContent = "Unable to start room.";
    roomCodeValue.textContent = "ERROR";
    alert(`Could not create a room: ${error.message}`);
  }
}

function buildQuestionItem(text) {
  const item = document.createElement("div");
  item.className = "flex items-start justify-between gap-2 border-b border-dashed border-[#ddd] pb-2";

  const questionText = document.createElement("p");
  questionText.className = "text-sm text-[#1a1a1a] flex-1";
  questionText.textContent = text;

  const badge = document.createElement("span");
  badge.className = "font-caveat text-xs px-2 py-0.5 border-[1.5px] border-[#5b8dd9] text-[#5b8dd9] rounded-sm whitespace-nowrap";
  badge.textContent = "Short Answer";

  item.appendChild(questionText);
  item.appendChild(badge);

  return item;
}

function buildTeacherResponseRow(response) {
  const row = document.createElement("div");
  row.className = "flex flex-col gap-2 border-b border-dashed border-[#ddd] pb-3";

  const topRow = document.createElement("div");
  topRow.className = "flex items-center justify-between gap-2";

  const name = document.createElement("span");
  name.className = "text-sm font-semibold text-[#1a1a1a]";
  name.textContent = response.studentName;

  const badge = document.createElement("span");
  const isCorrect = response.verdict === "correct" || response.verdict === "partially_correct";
  badge.className = `font-caveat text-xs font-bold px-2 py-0.5 rounded-sm border-[1.5px] ${
    isCorrect ? "border-[#4caf7d] text-[#4caf7d]" : "border-[#e05a5a] text-[#e05a5a]"
  }`;
  badge.textContent = `${isCorrect ? "Correct" : "Incorrect"} · ${Math.round(response.similarity * 100)}%`;

  topRow.appendChild(name);
  topRow.appendChild(badge);

  const answer = document.createElement("p");
  answer.className = "text-sm text-[#555]";
  answer.textContent = response.answer;

  const feedback = document.createElement("p");
  feedback.className = "text-xs text-[#888]";
  feedback.textContent = response.feedback;

  row.appendChild(topRow);
  row.appendChild(answer);
  row.appendChild(feedback);

  return row;
}

function renderTeacherResponses(responses) {
  responsesList.replaceChildren();

  if (!responses.length) {
    const placeholder = document.createElement("p");
    placeholder.className = "text-sm text-[#aaa] italic";
    placeholder.textContent = "No student responses yet.";
    responsesList.appendChild(placeholder);
    return;
  }

  responses.forEach((response) => {
    responsesList.appendChild(buildTeacherResponseRow(response));
  });
}

function renderParticipation(snapshot) {
  const participants = snapshot.participantCount || 0;
  const responded = snapshot.respondedCount || 0;
  const width = participants ? Math.round((responded / participants) * 100) : 0;

  respondedCount.textContent = `${responded} / ${participants}`;
  participationBar.style.width = `${width}%`;
  participationText.textContent = participants
    ? `${participants} student${participants === 1 ? "" : "s"} joined · ${width}% responded`
    : "Waiting for students to join.";
  correctCount.textContent = snapshot.correctCount || 0;
  wrongCount.textContent = snapshot.incorrectCount || 0;
}

async function pollRoomDashboard() {
  if (!currentRoomCode) return;

  try {
    const snapshot = await fetchJson(`${BASE_URL}/api/rooms/dashboard/${currentRoomCode}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    renderParticipation(snapshot);
    renderTeacherResponses(snapshot.responses || []);
  } catch (error) {
    console.error("Teacher dashboard polling error:", error);
  }
}

function startTeacherPolling() {
  if (teacherPollIntervalId) {
    window.clearInterval(teacherPollIntervalId);
  }

  teacherPollIntervalId = window.setInterval(() => {
    pollRoomDashboard();
  }, 3000);

  pollRoomDashboard();
}

renderParticipation({
  participantCount: 0,
  respondedCount: 0,
  correctCount: 0,
  incorrectCount: 0
});
renderTeacherResponses([]);

async function sendQuestion() {
  const text = questionInput.value.trim();
  const sampleAnswer = referenceAnswerInput.value.trim();
  if (!text || !sampleAnswer) {
    alert("Please enter both the question and the reference answer.");
    return;
  }

  if (!currentRoomCode) {
    alert("Your room is still starting. Please wait a moment and try again.");
    return;
  }

  setSendQuestionButtonState(true, "Sending...");

  try {
    await fetchJson(`${BASE_URL}/api/rooms/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        roomCode: currentRoomCode,
        question: text,
        sampleAnswer
      })
    });

    questionInput.value = "";
    referenceAnswerInput.value = "";
    appendQuestionItem(text);
    showActiveQuestion(text);
    renderParticipation({
      participantCount: getParticipantCount(),
      respondedCount: 0,
      correctCount: 0,
      incorrectCount: 0
    });
    renderTeacherResponses([]);
    pollRoomDashboard();
  } catch (error) {
    alert(`Could not send the question: ${error.message}`);
  } finally {
    setSendQuestionButtonState(false);
  }
}

function buildAdminUserRow(userRecord) {
  const row = document.createElement("div");
  row.className = "flex flex-col gap-2 border-b border-dashed border-[#ddd] pb-3 md:flex-row md:items-center md:justify-between";

  const identity = document.createElement("div");

  const name = document.createElement("p");
  name.className = "text-sm font-semibold text-[#1a1a1a]";
  name.textContent = `${userRecord.first_name} ${userRecord.last_name}`;

  const email = document.createElement("p");
  email.className = "text-sm text-[#666]";
  email.textContent = userRecord.email;

  identity.appendChild(name);
  identity.appendChild(email);

  const meta = document.createElement("div");
  meta.className = "flex flex-wrap items-center gap-2 text-xs";

  const roleBadge = document.createElement("span");
  roleBadge.className = "font-caveat rounded-sm border-[1.5px] border-[#5b8dd9] px-2 py-0.5 text-[#5b8dd9]";
  roleBadge.textContent = userRecord.role;

  const apiCalls = document.createElement("span");
  apiCalls.className = "rounded-sm border border-dashed border-[#bbb] px-2 py-0.5 text-[#555]";
  apiCalls.textContent = `${userRecord.api_calls || 0} API calls`;

  const createdAt = document.createElement("span");
  createdAt.className = "text-[#888]";
  createdAt.textContent = `Joined ${new Date(userRecord.created_at).toLocaleString()}`;

  meta.appendChild(roleBadge);
  meta.appendChild(apiCalls);
  meta.appendChild(createdAt);

  row.appendChild(identity);
  row.appendChild(meta);

  return row;
}

function renderAdminUsers(users) {
  adminUsersList.replaceChildren();

  if (!users.length) {
    const empty = document.createElement("p");
    empty.className = "text-sm text-[#aaa] italic";
    empty.textContent = "No users found.";
    adminUsersList.appendChild(empty);
    return;
  }

  users.forEach((userRecord) => {
    adminUsersList.appendChild(buildAdminUserRow(userRecord));
  });
}

function renderRoleBreakdown(users) {
  const counts = users.reduce((accumulator, userRecord) => {
    const role = userRecord.role || "unknown";
    accumulator[role] = (accumulator[role] || 0) + 1;
    return accumulator;
  }, {});

  const summary = Object.entries(counts)
    .map(([role, count]) => `${role}: ${count}`)
    .join(" | ");

  adminRoleBreakdown.textContent = summary || "No users yet.";
}

async function loadAdminDashboard() {
  adminRefreshButton.disabled = true;
  adminRefreshButton.textContent = "Refreshing...";

  try {
    const headers = {
      Authorization: `Bearer ${token}`
    };

    const [users, usage] = await Promise.all([
      fetchJson(`${BASE_URL}/api/admin/users`, { headers }),
      fetchJson(`${BASE_URL}/api/admin/usage`, { headers })
    ]);

    adminTotalCalls.textContent = usage.totalApiCalls || 0;
    adminUserCount.textContent = users.length;
    renderRoleBreakdown(users);
    renderAdminUsers(users);
  } catch (error) {
    adminUsersList.replaceChildren();

    const failure = document.createElement("p");
    failure.className = "text-sm text-[#e05a5a]";
    failure.textContent = error.message;
    adminUsersList.appendChild(failure);
  } finally {
    adminRefreshButton.disabled = false;
    adminRefreshButton.textContent = "Refresh Data";
  }
}

async function refreshAdminDashboard() {
  await loadAdminDashboard();
}

function closeRoomOnExit() {
  if (!currentRoomCode) return;

  try {
    fetch(`${BASE_URL}/api/rooms/close/${currentRoomCode}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      },
      keepalive: true
    });
  } catch (error) {
    console.error("Room cleanup failed:", error);
  }
}

window.addEventListener("beforeunload", closeRoomOnExit);

if (user.role === "admin") {
  adminRefreshButton.addEventListener("click", refreshAdminDashboard);
  loadAdminDashboard();
} else {
  initSession();
}
