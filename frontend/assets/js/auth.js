const authApiBaseUrl = "http://localhost:5001/api/auth";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// If already logged in, skip straight to the dashboard.
(function redirectIfAuthed() {
  if (localStorage.getItem("authToken")) {
    window.location.href = "index.html";
  }
})();

const toastContainer = document.getElementById("toastContainer");

function showToast(message, type) {
  const isSuccess = type === "success";
  const toastEl = document.createElement("div");
  toastEl.className = `toast app-toast ${isSuccess ? "success" : "danger"}`;
  toastEl.setAttribute("role", "alert");
  toastEl.innerHTML = `
    <div class="toast-body d-flex align-items-center">
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${isSuccess
          ? '<path d="M20 6 9 17l-5-5"/>'
          : '<circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><path d="M12 16h.01"/>'}
      </svg>
      <span class="flex-grow-1">${escapeHtml(message)}</span>
      <button type="button" class="btn-close ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  toastContainer.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 4500 });
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
  toast.show();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[character]));
}

function setFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);
  if (input) input.classList.toggle("is-invalid", Boolean(message));
  if (errorEl) errorEl.textContent = message || "";
}

function clearFieldErrors(pairs) {
  pairs.forEach(([inputId, errorId]) => setFieldError(inputId, errorId, ""));
}

function togglePasswordVisibility(buttonEl, inputEl) {
  const isHidden = inputEl.type === "password";
  inputEl.type = isHidden ? "text" : "password";
  buttonEl.innerHTML = isHidden
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function setButtonLoading(buttonEl, isLoading, loadingText, defaultText) {
  buttonEl.disabled = isLoading;
  buttonEl.classList.toggle("is-loading", isLoading);
  const labelEl = buttonEl.querySelector(".btn-label");
  if (labelEl) {
    labelEl.textContent = isLoading ? loadingText : defaultText;
  }
}

async function parseAuthResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    error.fieldErrors = data.errors || null;
    throw error;
  }

  return data;
}

function persistSession(payload) {
  if (!payload || !payload.token) {
    return;
  }
  localStorage.setItem("authToken", payload.token);
  localStorage.setItem("authUser", JSON.stringify(payload.user || null));
}

// ---------------- Register page ----------------
function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");
  const submitBtn = document.getElementById("registerSubmit");
  const toggleBtn = document.getElementById("togglePassword");
  const strengthHint = document.getElementById("passwordHint");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => togglePasswordVisibility(toggleBtn, passwordInput));
  }

  if (passwordInput && strengthHint) {
    passwordInput.addEventListener("input", () => {
      const length = passwordInput.value.length;
      if (length === 0) {
        strengthHint.textContent = "";
        strengthHint.classList.remove("ok");
      } else if (length < 6) {
        strengthHint.textContent = `${6 - length} more character${6 - length === 1 ? "" : "s"} needed`;
        strengthHint.classList.remove("ok");
      } else {
        strengthHint.textContent = "Looks good";
        strengthHint.classList.add("ok");
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors([
      ["name", "nameError"],
      ["email", "emailError"],
      ["password", "passwordError"],
      ["confirmPassword", "confirmPasswordError"]
    ]);

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    let hasError = false;

    if (!name) {
      setFieldError("name", "nameError", "Name is required.");
      hasError = true;
    }
    if (!email) {
      setFieldError("email", "emailError", "Email is required.");
      hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldError("email", "emailError", "Enter a valid email address.");
      hasError = true;
    }
    if (!password) {
      setFieldError("password", "passwordError", "Password is required.");
      hasError = true;
    } else if (password.length < 6) {
      setFieldError("password", "passwordError", "Password must be at least 6 characters.");
      hasError = true;
    }
    if (confirmPassword !== password) {
      setFieldError("confirmPassword", "confirmPasswordError", "Passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    setButtonLoading(submitBtn, true, "Creating account…", "Create account");

    try {
      const response = await fetch(`${authApiBaseUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const result = await parseAuthResponse(response);
      persistSession(result.data);
      showToast("Account created. Redirecting…", "success");
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 700);
    } catch (error) {
      if (error.status === 409) {
        setFieldError("email", "emailError", "An account with this email already exists.");
      } else if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          const errorId = `${field}Error`;
          if (document.getElementById(errorId)) {
            setFieldError(field, errorId, message);
          }
        });
      }
      showToast(error.message, "danger");
    } finally {
      setButtonLoading(submitBtn, false, "Creating account…", "Create account");
    }
  });
}

// ---------------- Login page ----------------
function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitBtn = document.getElementById("loginSubmit");
  const toggleBtn = document.getElementById("togglePassword");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => togglePasswordVisibility(toggleBtn, passwordInput));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors([
      ["email", "emailError"],
      ["password", "passwordError"]
    ]);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;
    if (!email) {
      setFieldError("email", "emailError", "Email is required.");
      hasError = true;
    }
    if (!password) {
      setFieldError("password", "passwordError", "Password is required.");
      hasError = true;
    }
    if (hasError) return;

    setButtonLoading(submitBtn, true, "Signing in…", "Sign in");

    try {
      const response = await fetch(`${authApiBaseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await parseAuthResponse(response);
      persistSession(result.data);
      showToast("Welcome back. Redirecting…", "success");
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 600);
    } catch (error) {
      if (error.status === 401) {
        showToast("Invalid email or password.", "danger");
      } else {
        showToast(error.message, "danger");
      }
    } finally {
      setButtonLoading(submitBtn, false, "Signing in…", "Sign in");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
});
