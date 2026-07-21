/* frontend/assets/js/dashboard.js */
const API_URL = "/api/products";

// ---- Auth guard ----
(function authGuard() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "login.html";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
    renderUserChip();
    loadDashboard();
});

function getAuthToken() {
  return localStorage.getItem("authToken");
}

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "null");
  } catch (error) {
    return null;
  }
}

function renderUserChip() {
  const user = getAuthUser();
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userAvatarEl = document.getElementById("userAvatar");

  if (!user) return;
  if (userNameEl) userNameEl.textContent = user.name || "Account";
  if (userEmailEl) userEmailEl.textContent = user.email || "";
  if (userAvatarEl && user.name) {
    userAvatarEl.textContent = user.name.trim().charAt(0).toUpperCase();
  }
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.href = "login.html";
  });
}

async function loadDashboard() {
    try {
        const token = getAuthToken();

        const response = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("authUser");
            window.location.href = "login.html";
            return;
        }

        const result = await response.json();
        const products = Array.isArray(result) ? result : (result.products || result.data || []);

        updateStats(products);
        renderRecentProducts(products);
        renderLowStock(products);

    } catch (err) {
        console.error("Failed to load dashboard data:", err);
    }
}

function updateStats(products) {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + Number(p.quantity || p.Quantity || 0), 0);
    const totalValue = products.reduce((sum, p) => {
        return sum + (Number(p.price || p.Price || 0) * Number(p.quantity || p.Quantity || 0));
    }, 0);
    const lowStock = products.filter(p => Number(p.quantity || p.Quantity || 0) <= 5).length;

    const valueElements = document.querySelectorAll(".stat-card .value");
    if (valueElements.length >= 4) {
        valueElements[0].textContent = totalProducts.toLocaleString();
        valueElements[1].textContent = totalStock.toLocaleString();
        valueElements[2].textContent = "$" + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        valueElements[3].textContent = lowStock.toLocaleString();
    }
}

function renderRecentProducts(products) {
    const container = document.querySelector(".lists-grid .neo-card:first-child .list-container");
    if (!container) return;

    container.innerHTML = "";

    if (products.length === 0) {
        container.innerHTML = `<div class="list-item"><div class="list-details"><h4>No products found</h4><p>Add products from the products page.</p></div></div>`;
        return;
    }

    products.slice(0, 5).forEach(product => {
        const pName = product.name || product.Name || "";
        const pCat = product.category || product.Category || "";
        const pPrice = Number(product.price || product.Price || 0);
        const pQty = product.quantity || product.Quantity || 0;

        container.innerHTML += `
        <div class="list-item d-flex align-items-center mb-3">
            <div class="list-icon success me-3">📦</div>
            <div class="list-details" style="flex-grow: 1;">
                <h4 class="mb-0 fs-6">${escapeHtml(pName)}</h4>
                <p class="mb-0 text-muted small">${escapeHtml(pCat)} — $${pPrice.toFixed(2)} (Qty: ${pQty})</p>
            </div>
        </div>
        `;
    });
}

function renderLowStock(products) {
    const container = document.querySelector(".lists-grid .neo-card:last-child .list-container");
    if (!container) return;

    container.innerHTML = "";

    const low = products.filter(p => Number(p.quantity || p.Quantity || 0) <= 5);

    if (low.length === 0) {
        container.innerHTML = `
        <div class="list-item">
            <div class="list-details">
                <h4 class="fs-6">No Low Stock Products 🎉</h4>
                <p class="text-muted small mb-0">All items are safely stocked above threshold.</p>
            </div>
        </div>
        `;
        return;
    }

    low.forEach(product => {
        const pName = product.name || product.Name || "";
        const pQty = product.quantity || product.Quantity || 0;

        container.innerHTML += `
        <div class="list-item d-flex align-items-center mb-3">
            <div class="list-icon warning me-3">⚠️</div>
            <div class="list-details" style="flex-grow: 1;">
                <h4 class="mb-0 fs-6">${escapeHtml(pName)}</h4>
                <p class="mb-0 text-muted small">${pQty} items left in stock</p>
            </div>
        </div>
        `;
    });
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