const productModel = require("../models/product.model");
const { validateProductInput } = require("../utils/validators");

async function getProducts(req, res, next) {
  try {
    const products = await productModel.findAll();
    res.json(products);
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const validation = validateProductInput(req.body);

    if (!validation.isValid) {
      return res.status(400).json({ message: "Validation failed", errors: validation.errors });
    }

    const product = await productModel.create(validation.data);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const validation = validateProductInput(req.body);

    if (!validation.isValid) {
      return res.status(400).json({ message: "Validation failed", errors: validation.errors });
    }

    const product = await productModel.update(req.params.id, validation.data);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await productModel.remove(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
