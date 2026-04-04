  if (user.firstName) {
      document.getElementById('welcome-name').textContent = user.firstName;
    }

    const questions = [];

    function sendQuestion() {
      const text = document.getElementById('question-input').value.trim();
      if (!text) return;

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