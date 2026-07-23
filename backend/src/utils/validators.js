const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function validateProductInput(input) {
  const errors = {};
  const body = input || {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const price = Number(body.price);
  const quantity = Number(body.quantity);

  if (!name) {
    errors.name = "Product name is required.";
  } else if (name.length > 120) {
    errors.name = "Product name must be 120 characters or fewer.";
  }

  if (!category) {
    errors.category = "Category is required.";
  } else if (category.length > 80) {
    errors.category = "Category must be 80 characters or fewer.";
  }

  if (!Number.isFinite(price) || price < 0) {
    errors.price = "Price must be a number greater than or equal to 0.";
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    errors.quantity = "Quantity must be a whole number greater than or equal to 0.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      category,
      price,
      quantity
    }
  };
}

function validateRegisterInput(input) {
  const errors = {};
  const body = input || {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) {
    errors.name = "Name is required.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: { name, email, password }
  };
}

function validateLoginInput(input) {
  const errors = {};
  const body = input || {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) {
    errors.email = "Email is required.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: { email, password }
  };
}

module.exports = {
  validateProductInput,
  validateRegisterInput,
  validateLoginInput
};
