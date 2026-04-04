 // Personalize dashboard
    if (user.firstName) {
      document.getElementById('welcome-name').textContent = user.firstName;
    }

    let answered = 0, correct = 0;

    async function submitAnswer() {
      const answer = document.getElementById('answer-input').value.trim();
      if (!answer) return;

      const questionText = document.getElementById('question-text').textContent.trim();
      const referenceAnswer = "The mitochondria generates most of the chemical energy needed to power the cell's biochemical reactions. It is often called the powerhouse of the cell.";
      
      const submitBtn = document.getElementById('submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = "AI Evaluating... 🤖";

      try {
        // --- REAL AI BACKEND INTEGRATION ---
        const res = await fetch("http://localhost:3000/api/ai/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Secure the endpoint
          },
          body: JSON.stringify({
            question: questionText,
            referenceAnswer: referenceAnswer,
            studentAnswer: answer
          })
        });

        // Check for the Milestone 1 API limit requirement
        if (res.headers.has('X-API-Warning')) {
          alert("API LIMIT WARNING: " + res.headers.get('X-API-Warning'));
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to evaluate answer");

        // UI Logic based on real AI verdict
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
          resultFeedback.textContent = data.feedback; // Real feedback from AI
          correct++;
        } else {
          resultBox.className = 'border-[2px] rounded-sm p-3 border-[#e05a5a] bg-[#fff5f5]';
          resultLabel.textContent = '✗ Not quite.';
          resultLabel.style.color = '#e05a5a';
          resultFeedback.textContent = data.feedback; // Real feedback from AI
        }

        // Update Stats
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

        // Auto-hide after 5 seconds to simulate next question
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