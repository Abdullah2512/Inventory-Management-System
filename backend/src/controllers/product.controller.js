const productModel = require("../models/product.model");
const { validateProductInput } = require("../utils/validators");

function getUploadedImageUrl(req) {
  return req.file ? `/uploads/${req.file.filename}` : undefined;
}

async function getProducts(req, res, next) {
  try {
    const { search, category, page, limit, sortBy, sortOrder } = req.query;
    const result = await productModel.findAll({ search, category, page, limit, sortBy, sortOrder });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await productModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const validation = validateProductInput(req.body || {});

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors
      });
    }

    const product = await productModel.create({
      ...validation.data,
      image_url: getUploadedImageUrl(req) || null
    });

    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const validation = validateProductInput(req.body || {});

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors
      });
    }

    const updateData = { ...validation.data };
    const imageUrl = getUploadedImageUrl(req);

    if (imageUrl) {
      updateData.image_url = imageUrl;
    }

    const product = await productModel.update(req.params.id, updateData);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await productModel.remove(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function getCategories(req, res, next) {
  try {
    const categories = await productModel.getCategories();
    return res.json(categories);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories
};
