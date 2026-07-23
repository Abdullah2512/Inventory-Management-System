// Shared helpers used by every page (dashboard + products).
// Load this before any page-specific script (app.js / dashboard.js).

function isPublicPage() {
  const path = window.location.pathname.split("/").pop()?.toLowerCase() || "";
  return ["", "login.html", "register.html"].includes(path);
}

function requireAuth() {
  if (isPublicPage()) {
    return;
  }

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  if (!token) {
    window.location.replace("login.html");
    return;
  }
}

requireAuth();