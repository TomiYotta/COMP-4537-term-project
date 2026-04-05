// TODO (Person 3): Grab the token and BASE_URL setup from Auth.js so you can use it here.
// const token = localStorage.getItem('token'); 
// let currentRoomCode = null;

if (user.firstName) {
  document.getElementById('welcome-name').textContent = user.firstName;
}

// TODO (Person 3): CREATE ROOM ON LOAD
// Write a function called initSession() and call it immediately.
// It needs to fetch POST `${BASE_URL}/api/rooms/create` with the Authorization Bearer token.
// The backend will return { roomCode: "123456" }. Save that to the `currentRoomCode` variable.
// Update the UI to display this 6-digit code to the teacher so students can join.

const questions = [];

async function sendQuestion() {
  const text = document.getElementById('question-input').value.trim();
  if (!text) return;

  // TODO (Person 3): GET THE SAMPLE ANSWER
  // Before sending the question, prompt the teacher for the correct answer:
  // const sampleAnswer = prompt("Provide the correct reference answer for the AI:");
  // if (!sampleAnswer) return;

  // TODO (Person 3): BROADCAST QUESTION TO ROOM
  // Wrap the following UI logic in a try/catch.
  // Make a fetch POST to `${BASE_URL}/api/rooms/ask`.
  // Headers: Content-Type application/json, and Authorization Bearer token.
  // Body: JSON.stringify({ roomCode: currentRoomCode, question: text, sampleAnswer })
  // Only execute the UI updates below if the response is successful.

  questions.push({ text });
  document.getElementById('question-input').value = '';
  document.getElementById('no-questions-msg')?.remove();

  const list = document.getElementById('questions-list');
  const item = document.createElement('div');
  item.className = 'flex items-start justify-between gap-2 border-b border-dashed border-[#ddd] pb-2';
  item.innerHTML = `
    <p class="text-sm text-[#1a1a1a] flex-1">${text}</p>
    <span class="font-caveat text-xs px-2 py-0.5 border-[1.5px] border-[#5b8dd9] text-[#5b8dd9] rounded-sm whitespace-nowrap">Short Answer</span>
  `;
  list.appendChild(item);

  document.getElementById('active-banner').classList.remove('hidden');
  document.getElementById('active-q-text').textContent = text;
}

// TODO (Person 3): CLEAN UP ROOM ON EXIT
// Add a `window.addEventListener('beforeunload', ...)` listener.
// If `currentRoomCode` exists, use `navigator.sendBeacon()` to send a DELETE request 
// to `${BASE_URL}/api/rooms/close/${currentRoomCode}`. This ensures the room is deleted from the DB when they close the tab.