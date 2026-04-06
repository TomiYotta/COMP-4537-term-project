const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_URL = isLocal
  ? "http://localhost:3000/api/auth"
  : "https://comp-4537-term-project.onrender.com/api/auth";

const token = new URLSearchParams(window.location.search).get("token");

if (!token) {
  document.getElementById("error-msg").textContent = "Invalid or missing reset token.";
  document.getElementById("error-msg").classList.remove("hidden");
}

async function handleReset() {
  const password = document.getElementById("new-password").value.trim();
  const confirm = document.getElementById("confirm-password").value.trim();

  document.getElementById("error-msg").classList.add("hidden");
  document.getElementById("success-msg").classList.add("hidden");

  if (!password || !confirm) {
    return showError("All fields are required.");
  }

  if (password !== confirm) {
    return showError("Passwords do not match.");
  }

  if (password.length < 8) {
    return showError("Password must be at least 8 characters.");
  }

  try {
    const res = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Reset failed.");

    const successDiv = document.getElementById("success-msg");
    successDiv.textContent = "Password reset! Redirecting to login...";
    successDiv.classList.remove("hidden");

    setTimeout(() => {
      window.location.href = "Auth.html";
    }, 2000);

  } catch (err) {
    showError(err.message);
  }
}

function showError(msg) {
  const errDiv = document.getElementById("error-msg");
  errDiv.textContent = msg;
  errDiv.classList.remove("hidden");
}