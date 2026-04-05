// If you are looking at the site locally, use localhost. If hosted, use the live API.
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = isLocal 
  ? "http://localhost:3000" 
  : "https://comp-4537-term-project.onrender.com";
const API_URL = `${BASE_URL}/api/auth`;
    
let selectedRole = null;

function switchTab(tab) {
  // Show/hide tab bar (hide it on forgot panel)
  document.getElementById('tab-bar').classList.toggle('hidden', tab === 'forgot');

  ['login', 'signup', 'forgot'].forEach(t => {
    const tabBtn = document.getElementById('tab-' + t);
    if (tabBtn) tabBtn.classList.toggle('active', t === tab);
    document.getElementById('panel-' + t).classList.toggle('active', t === tab);
  });

  // Clear all messages
  ['login-error', 'signup-error', 'forgot-error', 'forgot-success'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
}

function switchToForgot() {
  switchTab('forgot');
}

function selectRole(role) {
  selectedRole = role;
  ['student','teacher'].forEach(r => {
    document.getElementById('role-' + r).classList.toggle('bg-[#2d2d2d]', r === role);
    document.getElementById('role-' + r).classList.toggle('text-[#fafaf7]', r === role);
    document.getElementById('role-' + r).classList.toggle('text-[#2d2d2d]', r !== role);
  });
}

function showError(panel, message) {
  const errDiv = document.getElementById(`${panel}-error`);
  errDiv.textContent = message;
  errDiv.classList.remove('hidden');
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) return showError('login', 'Please enter both email and password.');

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.user.role === 'admin' || data.user.role === 'teacher') {
      window.location.href = 'teacher-dashboard.html';
    } else {
      window.location.href = 'student-dashboard.html';
    }

  } catch (err) {
    showError('login', err.message);
  }
}

async function handleSignup() {
  const firstName = document.getElementById('signup-fname').value.trim();
  const lastName = document.getElementById('signup-lname').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();

  if (!firstName || !lastName || !email || !password) return showError('signup', 'All fields are required.');
  if (!selectedRole) return showError('signup', 'Please select a role!');

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password, role: selectedRole })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');

    alert("Account created successfully! Please log in.");
    switchTab('login');
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = "";

  } catch (err) {
    showError('signup', err.message);
  }
}

async function handleForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) return showError('forgot', 'Please enter your email.');

  // Hide previous messages
  document.getElementById('forgot-error').classList.add('hidden');
  document.getElementById('forgot-success').classList.add('hidden');

  try {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    // Show success (don't reveal if email exists or not in prod — up to you)
    const successDiv = document.getElementById('forgot-success');
    successDiv.textContent = 'If that email exists, a reset link has been sent.';
    successDiv.classList.remove('hidden');
    document.getElementById('forgot-email').value = '';

  } catch (err) {
    showError('forgot', err.message);
  }
}