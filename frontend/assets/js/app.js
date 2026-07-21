/* frontend/assets/js/app.js */
const apiBaseUrl = "/api/products";

// ---- Auth guard ----
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
const categoryFilter = document.getElementById("categoryFilter");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");
const paginationInfo = document.getElementById("paginationInfo");
const statTotalProducts = document.getElementById("statTotalProducts");
const statTotalStock = document.getElementById("statTotalStock");
const statTotalValue = document.getElementById("statTotalValue");
const toastContainer = document.getElementById("toastContainer");

const productModalEl = document.getElementById("productModal");
let productModal = null;

// ---- State ----
let products = [];
let searchTerm = "";
let selectedCategory = "";
let sortKey = "id";
let sortDirection = "asc";
let currentPage = 1;
const pageSize = 8;

document.addEventListener("DOMContentLoaded", () => {
  if (productModalEl) {
    productModal = new bootstrap.Modal(productModalEl);
  }
  renderUserChip();
  loadProducts();
  loadCategories();
});

if (productForm) {
  productForm.addEventListener("submit", handleFormSubmit);
}
if (cancelEditButton) {
  cancelEditButton.addEventListener("click", resetForm);
}
if (openAddModalBtn) {
  openAddModalBtn.addEventListener("click", () => {
    resetForm();
    if (productModal) {
      productModal.show();
    }
  });
}
if (productModalEl) {
  productModalEl.addEventListener("hidden.bs.modal", resetForm);
}

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

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value.trim();
    currentPage = 1;
    loadProducts();
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", (event) => {
    selectedCategory = event.target.value;
    currentPage = 1;
    loadProducts();
  });
}

document.querySelectorAll("[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.getAttribute("data-sort");
    if (sortKey === key) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDirection = "asc";
    }
    currentPage = 1;
    loadProducts();
  });
});

if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      loadProducts();
    }
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    currentPage += 1;
    loadProducts();
  });
}

// ---- Data loading ----
async function loadProducts() {
  try {
    setTableLoading();
    
    const params = new URLSearchParams({
      search: searchTerm,
      category: selectedCategory,
      page: currentPage,
      limit: pageSize,
      sortBy: sortKey,
      sortOrder: sortDirection
    });
    
    const response = await fetch(`${apiBaseUrl}?${params.toString()}`, {
      headers: authHeaders()
    });
    
    const data = await parseResponse(response);
    
    // Normalize data safely whether API responds with plain array, wrapper object, or data field
    if (Array.isArray(data)) {
      products = data;
    } else {
      products = data.products || data.data || [];
    }

    const totalItems = typeof data.total === 'number' ? data.total : products.length;
    currentPage = data.page || 1;
    const totalPages = data.totalPages || Math.ceil(totalItems / pageSize) || 1;
    
    const stats = data.stats || {
      totalProducts: totalItems,
      totalStock: products.reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      totalValue: products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.quantity || 0)), 0)
    };

    if (statTotalProducts) statTotalProducts.textContent = (stats.totalProducts || 0).toLocaleString();
    if (statTotalStock) statTotalStock.textContent = (stats.totalStock || 0).toLocaleString();
    if (statTotalValue) statTotalValue.textContent = `$${(stats.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    if (productCount) productCount.textContent = `${totalItems} ${totalItems === 1 ? "item" : "items"}`;
    updateSortIndicators();
    
    if (products.length === 0) {
      if (searchTerm || selectedCategory) {
        setTableMessage(`No products match the selected criteria.`, false);
      } else {
        setTableMessage("No products yet. Add your first product to get started.", false, true);
      }
    } else {
      productsTableBody.innerHTML = products.map(rowTemplate).join("");
    }
    
    const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalItems);
    if (paginationInfo) {
      paginationInfo.textContent = totalItems === 0 ? "" : `Showing ${startIdx}–${endIdx} of ${totalItems}`;
    }
      
    if (pageIndicator) pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
    
  } catch (error) {
    setTableMessage("Unable to load products.", true);
    showToast(error.message, "danger");
  }
}

async function loadCategories() {
  try {
    const response = await fetch(`${apiBaseUrl}/categories`, {
      headers: authHeaders()
    });
    const data = await parseResponse(response);
    const categories = Array.isArray(data) ? data : (data.categories || data.data || []);
    
    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">All Categories</option>';
      categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        if (cat === selectedCategory) {
          option.selected = true;
        }
        categoryFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Failed to load categories:", error);
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

    await parseResponse(response);

    if (isEditing) {
      showToast("Product updated successfully.", "success");
    } else {
      showToast("Product added successfully.", "success");
    }

    loadProducts();
    loadCategories();
    if (productModal) {
      productModal.hide();
    }
    resetForm();
  } catch (error) {
    showToast(error.message, "danger");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = productIdInput.value ? "Save Changes" : "Add Product";
  }
}

// ---- Rendering Helpers ----
function rowTemplate(product) {
  const pId = product.id || product.ID || product._id;
  const pName = product.name || product.Name || "";
  const pCategory = product.category || product.Category || "";
  const pPrice = Number(product.price || product.Price || 0);
  const pQty = Number(product.quantity || product.Quantity || 0);

  const qtyClass = pQty <= 5 ? "cell-qty cell-qty-low" : "cell-qty";
  return `
    <tr>
      <td class="cell-id">#${escapeHtml(String(pId))}</td>
      <td class="cell-name">${escapeHtml(pName)}</td>
      <td><span class="cell-category">${escapeHtml(pCategory)}</span></td>
      <td class="cell-price">$${pPrice.toFixed(2)}</td>
      <td class="${qtyClass}">${escapeHtml(String(pQty))}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action" type="button" title="Edit" onclick="startEdit(${pId})">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="btn-action danger" type="button" title="Delete" onclick="deleteProduct(${pId})">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function updateSortIndicators() {
  document.querySelectorAll("[data-sort]").forEach((th) => {
    const key = th.getAttribute("data-sort");
    const caret = th.querySelector(".sort-caret");
    if (!caret) return;
    th.classList.toggle("sort-active", key === sortKey);
    if (key === sortKey) {
      caret.textContent = sortDirection === "asc" ? "▲" : "▼";
    } else {
      caret.textContent = "";
    }
  });
}

// ---- Edit / Delete ----
window.startEdit = function(id) {
  const product = products.find((item) => (item.id === id || item.ID === id || item._id === id));

  if (!product) {
    showToast("Product not found.", "danger");
    return;
  }

  productIdInput.value = product.id || product.ID || product._id;
  nameInput.value = product.name || product.Name || "";
  categoryInput.value = product.category || product.Category || "";
  priceInput.value = product.price || product.Price || 0;
  quantityInput.value = product.quantity || product.Quantity || 0;
  formTitle.textContent = "Edit Product";
  submitButton.textContent = "Save Changes";
  cancelEditButton.classList.remove("d-none");
  
  if (productModal) {
    productModal.show();
  }
  window.setTimeout(() => nameInput.focus(), 300);
}

window.deleteProduct = async function(id) {
  const product = products.find((item) => (item.id === id || item.ID === id || item._id === id));
  const confirmed = window.confirm(`Delete ${product ? (product.name || product.Name) : "this product"}?`);

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    await parseResponse(response);
    showToast("Product deleted successfully.", "success");
    loadProducts();
    loadCategories();
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

    if (input) input.classList.add("is-invalid");
    if (errorElement) errorElement.textContent = message;
  });
}

function clearValidationErrors() {
  [nameInput, categoryInput, priceInput, quantityInput].forEach((input) => {
    if (input) input.classList.remove("is-invalid");
  });

  ["nameError", "categoryError", "priceError", "quantityError"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

// ---- Table state messages ----
function setTableLoading() {
  if (!productsTableBody) return;
  productsTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-4">
        <div class="spinner-border spinner-border-sm text-secondary me-2" role="status"></div> Loading products…
      </td>
    </tr>
  `;
}

function setTableMessage(message, isError, isEmpty) {
  if (!productsTableBody) return;
  if (isEmpty) {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5 text-muted">
          <div class="mb-2">📦</div>
          <div class="fw-bold">No products yet</div>
          <div class="small">${escapeHtml(message.replace("No products yet. ", ""))}</div>
        </td>
      </tr>
    `;
    return;
  }

  productsTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-4 text-muted">${escapeHtml(message)}</td>
    </tr>
  `;
}

// ---- Toasts ----
function showToast(message, type) {
  if (!toastContainer) return;
  const isSuccess = type === "success";
  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-white ${isSuccess ? "bg-success" : "bg-danger"} border-0 mb-2`;
  toastEl.setAttribute("role", "alert");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
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