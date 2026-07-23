const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function redirectIfAuthed() {
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  if (token) {
    window.location.href = "index.html";
  }
}

function setBusy(button, isBusy) {
  if (!button) return;
  button.disabled = isBusy;
  button.classList.toggle("is-loading", isBusy);
}

function setFieldError(field, message) {
  const input = document.getElementById(field);
  const error = document.getElementById(`${field}Error`);

  if (input) {
    input.classList.toggle("invalid", Boolean(message));
  }
  if (error) {
    error.textContent = message || "";
  }
}

function clearErrors(fields) {
  fields.forEach((field) => setFieldError(field, ""));
}

function togglePassword(button, input) {
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  button.textContent = showing ? "Show" : "Hide";
}

function initPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    const input = document.getElementById(button.dataset.passwordToggle);
    if (input) {
      button.addEventListener("click", () => togglePassword(button, input));
    }
  });
}

function initLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors(["email", "password"]);

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const submit = document.getElementById("loginSubmit");
    let invalid = false;

    if (!email) {
      setFieldError("email", "Email is required.");
      invalid = true;
    }
    if (!password) {
      setFieldError("password", "Password is required.");
      invalid = true;
    }
    if (invalid) return;

    setBusy(submit, true);
    try {
      const result = await api.login({ email, password });
      storage.setSession(result.data);
      toast("Welcome back.", "success");
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 400);
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setBusy(submit, false);
    }
  });
}

function initRegister() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const password = document.getElementById("password");
  const hint = document.getElementById("passwordHint");

  if (password && hint) {
    password.addEventListener("input", () => {
      if (!password.value) {
        hint.textContent = "";
      } else if (password.value.length < 6) {
        hint.textContent = `${6 - password.value.length} more character${password.value.length === 5 ? "" : "s"} needed`;
      } else {
        hint.textContent = "Password length is valid";
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors(["name", "email", "password", "confirmPassword"]);

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const pass = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const submit = document.getElementById("registerSubmit");
    let invalid = false;

    if (!name) {
      setFieldError("name", "Name is required.");
      invalid = true;
    }
    if (!email) {
      setFieldError("email", "Email is required.");
      invalid = true;
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldError("email", "Enter a valid email address.");
      invalid = true;
    }
    if (!pass || pass.length < 6) {
      setFieldError("password", "Password must be at least 6 characters.");
      invalid = true;
    }
    if (confirmPassword !== pass) {
      setFieldError("confirmPassword", "Passwords do not match.");
      invalid = true;
    }
    if (invalid) return;

    setBusy(submit, true);
    try {
      const result = await api.register({ name, email, password: pass });
      storage.setSession(result.data);
      toast("Account created.", "success");
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 400);
    } catch (error) {
      if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => setFieldError(field, message));
      }
      toast(error.message, "error");
    } finally {
      setBusy(submit, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  redirectIfAuthed();
  initPasswordToggles();
  initLogin();
  initRegister();
});