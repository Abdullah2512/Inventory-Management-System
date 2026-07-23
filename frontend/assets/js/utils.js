// Shared UI helpers used by every page (dashboard, products, and login/register).
// Unlike common.js, this file has no side effects on load — it's safe to
// include on public pages like login.html too.

const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";

const storage = {
  setSession(data) {
    const { token, user } = data || {};
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  getUser() {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (parseError) {
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  }
};

// Fills in the sidebar profile card (data-user-name / data-user-email /
// data-user-initial) and wires up the data-logout button.
function renderUser() {
  const user = storage.getUser();
  const nameEl = document.querySelector("[data-user-name]");
  const emailEl = document.querySelector("[data-user-email]");
  const initialEl = document.querySelector("[data-user-initial]");

  if (nameEl) nameEl.textContent = user?.name || "Account";
  if (emailEl) emailEl.textContent = user?.email || "";
  if (initialEl) {
    const source = (user?.name || user?.email || "A").trim();
    initialEl.textContent = source.charAt(0).toUpperCase() || "A";
  }

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      storage.clearSession();
      window.location.href = "login.html";
    });
  });
}

// Shows a toast in #toastContainer using the .toast/.toast.visible/
// .toast.success/.toast.error rules already defined in styles.css.
// "danger" is accepted as an alias for "error" since some call sites
// use that name.
function toast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const normalizedType = type === "danger" ? "error" : type;

  const el = document.createElement("div");
  el.className = `toast ${normalizedType}`;
  el.textContent = message;
  container.appendChild(el);

  requestAnimationFrame(() => el.classList.add("visible"));

  window.setTimeout(() => {
    el.classList.remove("visible");
    window.setTimeout(() => el.remove(), 250);
  }, 3500);
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value) || 0);
}

// Product image URLs from the backend are already same-origin
// (e.g. "/uploads/filename.jpg"), so this just passes them through.
function assetUrl(path) {
  return path || "";
}