/**
 * Centralized API layer — no external dependencies (native fetch()).
 * Exposes one function per backend endpoint (see routes/auth.routes.js
 * and routes/product.routes.js).
 */
(function () {
  const TOKEN_KEY = "authToken";
  const BASE_URL = "/api";

  function buildQueryString(params) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.append(key, value);
      }
    });
    const query = search.toString();
    return query ? `?${query}` : "";
  }

  function getAuthHeader() {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Turns a failed request into the same Error shape the old Axios
  // interceptor produced, so callers can keep doing
  // `catch (error) { showToast(error.message) }` unchanged.
  async function toNormalizedError(response) {
    let body = null;
    try {
      body = await response.json();
    } catch (parseError) {
      // Response had no JSON body (e.g. a plain-text 502) - that's fine.
    }

    const message = body?.message || `Request failed with status ${response.status}`;
    const normalizedError = new Error(message);
    normalizedError.status = response.status;
    normalizedError.errors = body?.errors;

    if (Array.isArray(normalizedError.errors)) {
      normalizedError.fieldErrors = normalizedError.errors.reduce((acc, fieldError) => {
        if (fieldError.field) {
          acc[fieldError.field] = fieldError.message;
        }
        return acc;
      }, {});
    }

    return normalizedError;
  }

  async function request(method, path, { params, body, isFormData } = {}) {
    const url = `${BASE_URL}${path}${buildQueryString(params)}`;

    const headers = { ...getAuthHeader() };
    let requestBody;

    if (isFormData) {
      // Don't set Content-Type manually: the browser adds the correct
      // multipart boundary automatically for a FormData body.
      requestBody = body;
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url, { method, headers, body: requestBody });
    } catch (networkError) {
      throw new Error("Network error. Please check your connection and try again.");
    }

    if (!response.ok) {
      throw await toNormalizedError(response);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  const api = {
    // ---- Auth (routes/auth.routes.js) ----
    register(payload) {
      return request("POST", "/auth/register", { body: payload });
    },

    login(payload) {
      return request("POST", "/auth/login", { body: payload });
    },

    // ---- Products (routes/product.routes.js, all require auth) ----
    getProducts(params = {}) {
      return request("GET", "/products", { params });
    },

    getCategories() {
      return request("GET", "/products/categories");
    },

    getProduct(id) {
      return request("GET", `/products/${id}`);
    },

    createProduct(formData) {
      return request("POST", "/products", { body: formData, isFormData: true });
    },

    updateProduct(id, formData) {
      return request("PUT", `/products/${id}`, { body: formData, isFormData: true });
    },

    deleteProduct(id) {
      return request("DELETE", `/products/${id}`);
    },
  };

  window.api = api;
})();