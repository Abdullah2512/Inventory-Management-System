// requireAuth() now lives in js/common.js (loaded before this file)
// since dashboard.js needs it too.

const pageSize = 8;
const state = {
  products: [],
  categories: [],
  search: "",
  category: "",
  sortBy: "id",
  sortOrder: "asc",
  page: 1,
  total: 0,
  totalPages: 1,
  stats: { totalProducts: 0, totalStock: 0, totalValue: 0 },
  editing: null
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  bindEvents();
  loadCategories();
  loadProducts();
});

function bindElements() {
  [
    "productForm", "productId", "name", "category", "price", "quantity", "productImage",
    "imagePreview", "imagePreviewContainer", "productsTableBody", "searchInput",
    "categoryFilter", "sortBy", "sortOrder", "prevPageBtn", "nextPageBtn",
    "pageIndicator", "paginationInfo", "productCount", "formTitle", "submitButton",
    "cancelEditButton", "openAddModalBtn", "modalBackdrop", "productModal",
    "statTotalProducts", "statTotalStock", "statTotalValue", "statLowStock",
    "statOutOfStock", "statInStock"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.productForm?.addEventListener("submit", submitProduct);
  els.openAddModalBtn?.addEventListener("click", () => openModal());
  els.cancelEditButton?.addEventListener("click", closeModal);
  els.modalBackdrop?.addEventListener("click", closeModal);

  document.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  els.productImage?.addEventListener("change", previewSelectedImage);
  els.searchInput?.addEventListener("input", debounce((event) => {
    state.search = event.target.value.trim();
    state.page = 1;
    loadProducts();
  }, 300));
  els.categoryFilter?.addEventListener("change", (event) => {
    state.category = event.target.value;
    state.page = 1;
    loadProducts();
  });
  els.sortBy?.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    state.page = 1;
    loadProducts();
  });
  els.sortOrder?.addEventListener("change", (event) => {
    state.sortOrder = event.target.value;
    state.page = 1;
    loadProducts();
  });
  els.prevPageBtn?.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      loadProducts();
    }
  });
  els.nextPageBtn?.addEventListener("click", () => {
    if (state.page < state.totalPages) {
      state.page += 1;
      loadProducts();
    }
  });
}

async function loadProducts() {
  setTableLoading();

  try {
    const result = await api.getProducts({
      search: state.search,
      category: state.category,
      page: state.page,
      limit: pageSize,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder
    });

    state.products = result.products || result.data || [];
    state.total = Number(result.total ?? state.products.length);
    state.page = Number(result.page || state.page);
    state.totalPages = Number(result.totalPages || 1);
    state.stats = result.stats || calculateStats(state.products);

    renderStats();
    renderProducts();
    renderPagination();
  } catch (error) {
    setTableMessage("Unable to load products. Please try again.");
    showToast(error.message, "danger");
  }
}

async function loadCategories() {
  try {
    const result = await api.getCategories();
    state.categories = Array.isArray(result) ? result : (result.categories || result.data || []);
    renderCategoryFilter();
  } catch (error) {
    showToast("Categories could not be loaded.", "danger");
  }
}

function renderCategoryFilter() {
  if (!els.categoryFilter) return;
  els.categoryFilter.innerHTML = `<option value="">All categories</option>${state.categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("")}`;
  els.categoryFilter.value = state.category;
}

function renderStats() {
  const lowStock = state.products.filter((product) => Number(product.quantity || 0) > 0 && Number(product.quantity || 0) <= 5).length;
  const outOfStock = state.products.filter((product) => Number(product.quantity || 0) === 0).length;
  const inStock = Math.max(0, Number(state.stats.totalProducts || 0) - outOfStock);

  setText("statTotalProducts", state.stats.totalProducts || 0);
  setText("statTotalStock", state.stats.totalStock || 0);
  setText("statTotalValue", money(state.stats.totalValue || 0));
  setText("statLowStock", lowStock);
  setText("statOutOfStock", outOfStock);
  setText("statInStock", inStock);
  setText("productCount", `${state.total.toLocaleString()} ${state.total === 1 ? "product" : "products"}`);
}

function renderProducts() {
  if (!els.productsTableBody) return;

  if (state.products.length === 0) {
    const message = state.search || state.category
      ? "No products match your current search or filters."
      : "No products yet. Add your first product to start tracking inventory.";
    setTableMessage(message);
    return;
  }

  els.productsTableBody.innerHTML = state.products.map((product) => {
    const quantity = Number(product.quantity || 0);
    const image = assetUrl(product.image_url);
    return `
      <tr>
        <td>
          <div class="product-cell">
            <div class="product-thumb">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}">` : `<span>${escapeHtml((product.name || "P").charAt(0).toUpperCase())}</span>`}</div>
            <div>
              <strong>${escapeHtml(product.name)}</strong>
              <small>#${escapeHtml(product.id)}</small>
            </div>
          </div>
        </td>
        <td><span class="category-chip">${escapeHtml(product.category)}</span></td>
        <td>${money(product.price)}</td>
        <td><span class="stock-pill ${quantity === 0 ? "danger" : quantity <= 5 ? "warning" : "success"}">${quantity.toLocaleString()}</span></td>
        <td>${money(Number(product.price || 0) * quantity)}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="icon-button" title="Edit product" data-edit="${escapeHtml(product.id)}">Edit</button>
            <button type="button" class="icon-button danger" title="Delete product" data-delete="${escapeHtml(product.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  els.productsTableBody.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => editProduct(button.dataset.edit));
  });
  els.productsTableBody.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteProduct(button.dataset.delete));
  });
}

function renderPagination() {
  const start = state.total === 0 ? 0 : (state.page - 1) * pageSize + 1;
  const end = Math.min(state.page * pageSize, state.total);

  setText("paginationInfo", state.total === 0 ? "No records to show" : `Showing ${start.toLocaleString()}-${end.toLocaleString()} of ${state.total.toLocaleString()}`);
  setText("pageIndicator", `${state.page} / ${state.totalPages}`);

  if (els.prevPageBtn) els.prevPageBtn.disabled = state.page <= 1;
  if (els.nextPageBtn) els.nextPageBtn.disabled = state.page >= state.totalPages;
}

function openModal(product = null) {
  resetForm();
  state.editing = product;

  if (product) {
    els.productId.value = product.id;
    els.name.value = product.name || "";
    els.category.value = product.category || "";
    els.price.value = product.price || 0;
    els.quantity.value = product.quantity || 0;
    els.formTitle.textContent = "Edit product";
    els.submitButton.textContent = "Save changes";
    const image = assetUrl(product.image_url);
    if (image) showImagePreview(image);
  }

  els.productModal?.classList.add("open");
  els.modalBackdrop?.classList.add("open");
  document.body.classList.add("modal-open");
  window.setTimeout(() => els.name?.focus(), 50);
}

function closeModal() {
  els.productModal?.classList.remove("open");
  els.modalBackdrop?.classList.remove("open");
  document.body.classList.remove("modal-open");
  resetForm();
}

function resetForm() {
  els.productForm?.reset();
  state.editing = null;
  if (els.productId) els.productId.value = "";
  if (els.formTitle) els.formTitle.textContent = "Add product";
  if (els.submitButton) els.submitButton.textContent = "Add product";
  hideImagePreview();
  clearValidation();
}

async function submitProduct(event) {
  event.preventDefault();
  clearValidation();

  const payload = {
    name: els.name.value.trim(),
    category: els.category.value.trim(),
    price: Number(els.price.value),
    quantity: Number(els.quantity.value)
  };
  const errors = validateProduct(payload);
  const file = els.productImage.files[0];

  if (file) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      errors.productImage = "Only JPG, PNG, and WEBP images are allowed.";
    } else if (file.size > 2 * 1024 * 1024) {
      errors.productImage = "Image must be 2MB or smaller.";
    }
  }

  if (Object.keys(errors).length > 0) {
    showValidation(errors);
    return;
  }

  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("category", payload.category);
  formData.append("price", String(payload.price));
  formData.append("quantity", String(payload.quantity));
  if (file) {
    formData.append("image", file);
  }

  const id = els.productId.value;
  setSubmitting(true);

  try {
    if (id) {
    await api.updateProduct(id, formData);
    showToast("Product updated successfully.", "success");
} else {
    await api.createProduct(formData);
    showToast("Product added successfully.", "success");
}
    closeModal();
    await Promise.all([loadProducts(), loadCategories()]);
  } catch (error) {
    showToast(error.message, "danger");
  } finally {
    setSubmitting(false);
  }
}

function editProduct(id) {
  const product = state.products.find((item) => String(item.id) === String(id));
  if (!product) {
    showToast("Product not found on this page.", "danger");
    return;
  }
  openModal(product);
}

async function deleteProduct(id) {
  const product = state.products.find((item) => String(item.id) === String(id));
  const confirmed = window.confirm(`Delete ${product?.name || "this product"}?`);
  if (!confirmed) return;

  try {
    await api.deleteProduct(id);
    showToast("Product deleted.", "success");
    if (state.products.length === 1 && state.page > 1) {
      state.page -= 1;
    }
    await Promise.all([loadProducts(), loadCategories()]);
  } catch (error) {
    showToast(error.message, "danger");
  }
}

function previewSelectedImage() {
  const file = els.productImage.files[0];
  clearFieldError("productImage");

  if (!file) {
    hideImagePreview();
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    setFieldError("productImage", "Only JPG, PNG, and WEBP images are allowed.");
    els.productImage.value = "";
    hideImagePreview();
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setFieldError("productImage", "Image must be 2MB or smaller.");
    els.productImage.value = "";
    hideImagePreview();
    return;
  }

  showImagePreview(URL.createObjectURL(file));
}

function showImagePreview(src) {
  if (els.imagePreview && els.imagePreviewContainer) {
    els.imagePreview.src = src;
    els.imagePreviewContainer.hidden = false;
  }
}

function hideImagePreview() {
  if (els.imagePreview && els.imagePreviewContainer) {
    els.imagePreview.removeAttribute("src");
    els.imagePreviewContainer.hidden = true;
  }
}

function validateProduct(product) {
  const errors = {};
  if (!product.name) errors.name = "Product name is required.";
  if (!product.category) errors.category = "Category is required.";
  if (!Number.isFinite(product.price) || product.price < 0) errors.price = "Price must be 0 or greater.";
  if (!Number.isInteger(product.quantity) || product.quantity < 0) errors.quantity = "Quantity must be a whole number 0 or greater.";
  return errors;
}

function showValidation(errors) {
  Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
}

function clearValidation() {
  ["name", "category", "price", "quantity", "productImage"].forEach(clearFieldError);
}

function setFieldError(field, message) {
  const input = document.getElementById(field);
  const error = document.getElementById(`${field}Error`);
  input?.classList.toggle("invalid", Boolean(message));
  if (error) error.textContent = message || "";
}

function clearFieldError(field) {
  setFieldError(field, "");
}

function setSubmitting(isSubmitting) {
  if (els.submitButton) {
    els.submitButton.disabled = isSubmitting;
    els.submitButton.textContent = isSubmitting ? "Saving..." : (els.productId.value ? "Save changes" : "Add product");
  }
}

function setTableLoading() {
  if (!els.productsTableBody) return;
  els.productsTableBody.innerHTML = `
    <tr>
      <td colspan="6"><div class="table-state"><span class="loader"></span> Loading products...</div></td>
    </tr>
  `;
}

function setTableMessage(message) {
  if (!els.productsTableBody) return;
  els.productsTableBody.innerHTML = `
    <tr>
      <td colspan="6"><div class="empty-state">${escapeHtml(message)}</div></td>
    </tr>
  `;
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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
function escapeHtml(text) {
  if (text === null || text === undefined) return "";

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function showToast(message, type = "success") {
    toast(message, type);
}