requireAuth();

const state = {
  products: [],
  stats: {
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0
  }
};

document.addEventListener("DOMContentLoaded", () => {
  renderUser();
  loadDashboard();
});

async function loadDashboard() {
  setDashboardLoading(true);

  try {
    const result = await api.getProducts({
      page: 1,
      limit: 100,
      sortBy: "created_at",
      sortOrder: "desc"
    });

    state.products = result.products || result.data || [];
    state.stats = result.stats || calculateStats(state.products);

    renderStats();
    renderCategoryBars();
    renderRecentProducts();
    renderLowStock();
  } catch (error) {
    toast(error.message, "error");
    renderPanelMessage("recentProducts", "Unable to load products.");
    renderPanelMessage("lowStockList", "Unable to load stock alerts.");
  } finally {
    setDashboardLoading(false);
  }
}

function calculateStats(products) {
  return products.reduce((acc, product) => {
    const quantity = Number(product.quantity || 0);
    const price = Number(product.price || 0);
    acc.totalProducts += 1;
    acc.totalStock += quantity;
    acc.totalValue += price * quantity;
    return acc;
  }, { totalProducts: 0, totalStock: 0, totalValue: 0 });
}

function renderStats() {
  const lowStock = state.products.filter((product) => Number(product.quantity || 0) > 0 && Number(product.quantity || 0) <= 5).length;
  const outOfStock = state.products.filter((product) => Number(product.quantity || 0) === 0).length;
  const categories = new Set(state.products.map((product) => product.category).filter(Boolean)).size;

  setText("statTotalProducts", state.stats.totalProducts || 0);
  setText("statTotalStock", state.stats.totalStock || 0);
  setText("statTotalValue", money(state.stats.totalValue || 0));
  setText("statLowStock", lowStock);
  setText("statOutOfStock", outOfStock);
  setText("statCategories", categories);
}

function renderCategoryBars() {
  const container = document.getElementById("categoryBreakdown");
  if (!container) return;

  const totals = state.products.reduce((acc, product) => {
    const category = product.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + Number(product.quantity || 0);
    return acc;
  }, {});
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...entries.map(([, total]) => total), 1);

  if (entries.length === 0) {
    container.innerHTML = emptyState("No category data yet.");
    return;
  }

  container.innerHTML = entries.map(([category, total]) => `
    <div class="bar-row">
      <div class="bar-meta">
        <span>${escapeHtml(category)}</span>
        <strong>${Number(total).toLocaleString()}</strong>
      </div>
      <div class="bar-track"><span style="width:${Math.max(6, (total / max) * 100)}%"></span></div>
    </div>
  `).join("");
}

function renderRecentProducts() {
  const container = document.getElementById("recentProducts");
  if (!container) return;

  if (state.products.length === 0) {
    container.innerHTML = emptyState("No products yet. Add your first product from Products.");
    return;
  }

  container.innerHTML = state.products.slice(0, 6).map((product) => productListItem(product)).join("");
}

function renderLowStock() {
  const container = document.getElementById("lowStockList");
  if (!container) return;

  const products = state.products
    .filter((product) => Number(product.quantity || 0) <= 5)
    .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0));

  if (products.length === 0) {
    container.innerHTML = emptyState("All visible products are above the low-stock threshold.");
    return;
  }

  container.innerHTML = products.slice(0, 6).map((product) => productListItem(product, true)).join("");
}

function productListItem(product, alert = false) {
  const image = assetUrl(product.image_url);
  const quantity = Number(product.quantity || 0);

  return `
    <article class="list-item">
      <div class="product-thumb">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}">` : initials(product.name)}</div>
      <div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.category)} · ${money(product.price)} · ${quantity.toLocaleString()} units</p>
      </div>
      <span class="status-pill ${alert ? "warning" : "success"}">${alert ? "Review" : "Healthy"}</span>
    </article>
  `;
}

function setDashboardLoading(isLoading) {
  document.body.classList.toggle("is-loading", isLoading);
}

function renderPanelMessage(id, message) {
  const container = document.getElementById(id);
  if (container) container.innerHTML = emptyState(message);
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function initials(value) {
  return `<span>${escapeHtml(String(value || "P").trim().charAt(0).toUpperCase() || "P")}</span>`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = typeof value === "number" ? value.toLocaleString() : value;
}
