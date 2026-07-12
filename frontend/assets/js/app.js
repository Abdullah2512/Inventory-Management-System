const apiBaseUrl = "http://localhost:5001/api/products";

// ---- Auth guard ----
// Runs immediately, before anything else on the page, so an unauthenticated
// visitor never sees dashboard content flash before being redirected.
(function authGuard() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "login.html";
  }
})();

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

function authHeaders(extraHeaders) {
  return {
    ...(extraHeaders || {}),
    Authorization: `Bearer ${getAuthToken()}`
  };
}

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  window.location.href = "login.html";
}

// If the API says our token is no longer valid, force a clean logout
// rather than leaving the user staring at a broken dashboard.
function handleAuthFailure() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  window.location.href = "login.html";
}

// ---- DOM refs ----
const productForm = document.getElementById("productForm");
const productIdInput = document.getElementById("productId");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const priceInput = document.getElementById("price");
const quantityInput = document.getElementById("quantity");
const productsTableBody = document.getElementById("productsTableBody");
const productCount = document.getElementById("productCount");
const formTitle = document.getElementById("formTitle");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const openAddModalBtn = document.getElementById("openAddModalBtn");
const searchInput = document.getElementById("searchInput");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");
const paginationInfo = document.getElementById("paginationInfo");
const statTotalProducts = document.getElementById("statTotalProducts");
const statTotalStock = document.getElementById("statTotalStock");
const statTotalValue = document.getElementById("statTotalValue");
const toastContainer = document.getElementById("toastContainer");

const productModalEl = document.getElementById("productModal");
const productModal = new bootstrap.Modal(productModalEl);

// ---- State ----
let products = [];
let searchTerm = "";
let sortKey = "id";
let sortDirection = "asc";
let currentPage = 1;
const pageSize = 8;

document.addEventListener("DOMContentLoaded", () => {
  renderUserChip();
  loadProducts();
});
productForm.addEventListener("submit", handleFormSubmit);
cancelEditButton.addEventListener("click", resetForm);
openAddModalBtn.addEventListener("click", () => {
  resetForm();
  productModal.show();
});
productModalEl.addEventListener("hidden.bs.modal", resetForm);

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

function renderUserChip() {
  const user = getAuthUser();
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userAvatarEl = document.getElementById("userAvatar");

  if (!user || !userNameEl || !userEmailEl || !userAvatarEl) {
    return;
  }

  userNameEl.textContent = user.name || "Account";
  userEmailEl.textContent = user.email || "";
  userAvatarEl.textContent = (user.name || "?").trim().charAt(0).toUpperCase();
}

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  currentPage = 1;
  renderProducts();
});

document.querySelectorAll("[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.getAttribute("data-sort");
    if (sortKey === key) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDirection = "asc";
    }
    renderProducts();
  });
});

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderProducts();
  }
});

nextPageBtn.addEventListener("click", () => {
  currentPage += 1;
  renderProducts();
});

// ---- Data loading ----
async function loadProducts() {
  try {
    setTableLoading();
    const response = await fetch(apiBaseUrl, {
      headers: authHeaders()
    });
    const data = await parseResponse(response);
    products = Array.isArray(data) ? data : [];
    currentPage = 1;
    renderProducts();
  } catch (error) {
    setTableMessage("Unable to load products.", true);
    showToast(error.message, "danger");
  }
}

// ---- Create / Update ----
async function handleFormSubmit(event) {
  event.preventDefault();
  clearValidationErrors();

  const payload = {
    name: nameInput.value.trim(),
    category: categoryInput.value.trim(),
    price: Number(priceInput.value),
    quantity: Number(quantityInput.value)
  };

  const validation = validateProduct(payload);

  if (!validation.isValid) {
    showValidationErrors(validation.errors);
    return;
  }

  const productId = productIdInput.value;
  const isEditing = Boolean(productId);

  try {
    submitButton.disabled = true;
    submitButton.textContent = isEditing ? "Saving..." : "Adding...";

    const response = await fetch(isEditing ? `${apiBaseUrl}/${productId}` : apiBaseUrl, {
      method: isEditing ? "PUT" : "POST",
      headers: authHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(payload)
    });

    const savedProduct = await parseResponse(response);

    if (isEditing) {
      products = products.map((product) => product.id === savedProduct.id ? savedProduct : product);
      showToast("Product updated successfully.", "success");
    } else {
      products = [...products, savedProduct];
      showToast("Product added successfully.", "success");
    }

    renderProducts();
    productModal.hide();
    resetForm();
  } catch (error) {
    showToast(error.message, "danger");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = productIdInput.value ? "Save Changes" : "Add Product";
  }
}

// ---- Rendering ----
function getFilteredSortedProducts() {
  let list = products;

  if (searchTerm) {
    list = list.filter((product) =>
      String(product.name).toLowerCase().includes(searchTerm) ||
      String(product.category).toLowerCase().includes(searchTerm)
    );
  }

  const direction = sortDirection === "asc" ? 1 : -1;
  list = [...list].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string") {
      return aVal.localeCompare(bVal) * direction;
    }
    return (Number(aVal) - Number(bVal)) * direction;
  });

  return list;
}

function renderProducts() {
  renderStats();

  const filtered = getFilteredSortedProducts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  productCount.textContent = `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`;
  updateSortIndicators();

  if (products.length === 0) {
    setTableMessage("No products yet. Add your first product to get started.", false, true);
  } else if (filtered.length === 0) {
    setTableMessage(`No products match “${searchInput.value.trim()}”.`, false);
  } else {
    productsTableBody.innerHTML = pageItems.map(rowTemplate).join("");
  }

  paginationInfo.textContent = filtered.length === 0
    ? ""
    : `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length}`;
  pageIndicator.textContent = `${currentPage} / ${totalPages}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

function rowTemplate(product) {
  const qtyClass = Number(product.quantity) <= 5 ? "cell-qty cell-qty-low" : "cell-qty";
  return `
    <tr>
      <td class="cell-id">#${escapeHtml(String(product.id))}</td>
      <td class="cell-name">${escapeHtml(product.name)}</td>
      <td><span class="cell-category">${escapeHtml(product.category)}</span></td>
      <td class="cell-price">$${Number(product.price).toFixed(2)}</td>
      <td class="${qtyClass}">${escapeHtml(String(product.quantity))}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action" type="button" title="Edit" onclick="startEdit(${product.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="btn-action danger" type="button" title="Delete" onclick="deleteProduct(${product.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderStats() {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
  const totalValue = products.reduce((sum, product) => sum + (Number(product.price || 0) * Number(product.quantity || 0)), 0);

  statTotalProducts.textContent = totalProducts.toLocaleString();
  statTotalStock.textContent = totalStock.toLocaleString();
  statTotalValue.textContent = `$${totalValue.toFixed(2)}`;
}

function updateSortIndicators() {
  document.querySelectorAll("[data-sort]").forEach((th) => {
    const key = th.getAttribute("data-sort");
    const caret = th.querySelector(".sort-caret");
    th.classList.toggle("sort-active", key === sortKey);
    if (key === sortKey) {
      caret.textContent = sortDirection === "asc" ? "▲" : "▼";
    } else {
      caret.textContent = "";
    }
  });
}

// ---- Edit / Delete ----
function startEdit(id) {
  const product = products.find((item) => item.id === id);

  if (!product) {
    showToast("Product not found.", "danger");
    return;
  }

  productIdInput.value = product.id;
  nameInput.value = product.name;
  categoryInput.value = product.category;
  priceInput.value = product.price;
  quantityInput.value = product.quantity;
  formTitle.textContent = "Edit Product";
  submitButton.textContent = "Save Changes";
  cancelEditButton.classList.remove("d-none");
  productModal.show();
  window.setTimeout(() => nameInput.focus(), 300);
}

async function deleteProduct(id) {
  const product = products.find((item) => item.id === id);
  const confirmed = window.confirm(`Delete ${product ? product.name : "this product"}?`);

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    await parseResponse(response);
    products = products.filter((productItem) => productItem.id !== id);
    renderProducts();
    showToast("Product deleted successfully.", "success");
  } catch (error) {
    showToast(error.message, "danger");
  }
}

// ---- Form helpers ----
function resetForm() {
  productForm.reset();
  productIdInput.value = "";
  clearValidationErrors();
  formTitle.textContent = "Add Product";
  submitButton.textContent = "Add Product";
  submitButton.disabled = false;
  cancelEditButton.classList.add("d-none");
}

function validateProduct(product) {
  const errors = {};

  if (!product.name) {
    errors.name = "Product name is required.";
  }

  if (!product.category) {
    errors.category = "Category is required.";
  }

  if (!Number.isFinite(product.price) || product.price < 0) {
    errors.price = "Price must be greater than or equal to 0.";
  }

  if (!Number.isInteger(product.quantity) || product.quantity < 0) {
    errors.quantity = "Quantity must be a whole number greater than or equal to 0.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    handleAuthFailure();
    throw new Error("Your session has expired. Redirecting to login…");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.errors
      ? Object.values(data.errors).join(" ")
      : data.message || "Request failed.";
    throw new Error(message);
  }

  return data;
}

function showValidationErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = document.getElementById(field);
    const errorElement = document.getElementById(`${field}Error`);

    input.classList.add("is-invalid");
    errorElement.textContent = message;
  });
}

function clearValidationErrors() {
  [nameInput, categoryInput, priceInput, quantityInput].forEach((input) => {
    input.classList.remove("is-invalid");
  });

  ["nameError", "categoryError", "priceError", "quantityError"].forEach((id) => {
    document.getElementById(id).textContent = "";
  });
}

// ---- Table state messages ----
function setTableLoading() {
  productsTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="table-loading">
        <div class="spinner-cell"><span class="spinner-ring"></span> Loading products…</div>
      </td>
    </tr>
  `;
}

function setTableMessage(message, isError, isEmpty) {
  if (isEmpty) {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty">
          <div class="empty-illustration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>
          </div>
          <div class="empty-title">No products yet</div>
          <div class="empty-sub">${escapeHtml(message.replace("No products yet. ", ""))}</div>
        </td>
      </tr>
    `;
    return;
  }

  productsTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="${isError ? "table-empty" : "table-empty"}">${escapeHtml(message)}</td>
    </tr>
  `;
}

// ---- Toasts ----
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
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
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