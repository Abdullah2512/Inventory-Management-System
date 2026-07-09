function validateProductInput(input) {
  const errors = {};
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "";
  const price = Number(input.price);
  const quantity = Number(input.quantity);

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

module.exports = {
  validateProductInput
};
