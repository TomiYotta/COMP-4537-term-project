const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = isLocal 
  ? "http://localhost:3000" 
  : "https://comp-4537-term-project.onrender.com";

// Personalize dashboard
if (user.firstName) {
  document.getElementById('welcome-name').textContent = user.firstName;
}

// TODO (Person 3): ROOM JOINING LOGIC
// 1. Create variables: `activeRoomCode` and `currentQuestionText`.
// 2. On page load, check if `sessionStorage.getItem('activeRoomCode')` exists.
// 3. If not, use a `prompt()` to ask the student for the 6-digit teacher code, and save it to sessionStorage.

// TODO (Person 3): POLLING LOGIC
// Write a function `pollForQuestions()` and run it in a `setInterval` every 3000ms.
// It needs to fetch GET `${BASE_URL}/api/rooms/active/${activeRoomCode}`.
// If `res.ok` and the returned `data.question` is different from `currentQuestionText`, update the UI:
// Set `document.getElementById('question-text').textContent = data.question`
// Unhide the question-card and answer-area, and hide the waiting-card.

let answered = 0, correct = 0;

async function submitAnswer() {
  const answer = document.getElementById('answer-input').value.trim();
  if (!answer) return;

  const questionText = document.getElementById('question-text').textContent.trim();
  
  // TODO (Person 3): REMOVE THIS HARDCODED ANSWER
  // The backend now securely looks up the reference answer from the database using the roomCode.
  // const referenceAnswer = "The mitochondria generates most..."; 
  
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = "AI Evaluating... 🤖";

  try {
    const res = await fetch(`${BASE_URL}/api/ai/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({
        // TODO (Person 3): UPDATE PAYLOAD
        // Replace `referenceAnswer` with the room code. 
        roomCode: activeRoomCode, // Make sure this variable is accessible here
        studentAnswer: answer
      })
    });

    if (res.headers.has('X-API-Warning')) {
      alert("API LIMIT WARNING: " + res.headers.get('X-API-Warning'));
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to evaluate answer");

    const isCorrect = (data.verdict === 'correct' || data.verdict === 'partially_correct');

    document.getElementById('answer-area').classList.add('hidden');
    const resultArea = document.getElementById('result-area');
    resultArea.classList.remove('hidden');
    const resultBox = document.getElementById('result-box');
    const resultLabel = document.getElementById('result-label');
    const resultFeedback = document.getElementById('result-feedback');

    if (isCorrect) {
      resultBox.className = 'border-[2px] rounded-sm p-3 border-[#4caf7d] bg-[#f0fff4]';
      resultLabel.textContent = data.verdict === 'correct' ? '✓ Correct!' : '✓ Partially Correct';
      resultLabel.style.color = '#4caf7d';
      resultFeedback.textContent = data.feedback; 
      correct++;
    } else {
      resultBox.className = 'border-[2px] rounded-sm p-3 border-[#e05a5a] bg-[#fff5f5]';
      resultLabel.textContent = '✗ Not quite.';
      resultLabel.style.color = '#e05a5a';
      resultFeedback.textContent = data.feedback; 
    }

    answered++;
    document.getElementById('no-history-msg')?.remove();
    const historyList = document.getElementById('history-list');
    const entry = document.createElement('div');
    entry.className = 'flex items-start justify-between gap-2 border-b border-dashed border-[#ddd] pb-2';
    entry.innerHTML = `
      <div class="flex-1">
        <p class="font-caveat text-xs text-[#888] mb-0.5">${questionText.substring(0,50)}...</p>
        <p class="text-sm text-[#1a1a1a]">${answer}</p>
      </div>
      <span class="font-caveat text-xs font-bold px-2 py-0.5 rounded-sm border-[1.5px] whitespace-nowrap ${isCorrect ? 'border-[#4caf7d] text-[#4caf7d]' : 'border-[#e05a5a] text-[#e05a5a]'}">${isCorrect ? '✓' : '✗'} ${Math.round(data.similarity * 100)}% Match</span>
    `;
    historyList.appendChild(entry);

    document.getElementById('stat-answered').textContent = answered;
    document.getElementById('stat-correct').textContent = correct;
    document.getElementById('stat-score').textContent = Math.round((correct / answered) * 100) + '%';

    setTimeout(() => {
      document.getElementById('question-card').classList.add('hidden');
      document.getElementById('waiting-card').classList.remove('hidden');
    }, 5000);

  } catch (err) {
    alert("Error evaluating answer: " + err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Answer →";
  }
}